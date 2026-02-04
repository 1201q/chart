import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, LessThanOrEqual, Repository } from 'typeorm';
import { TradingOrder } from '../entities/trading-order.entity';
import { TradingBalance } from '../entities/trading-balance.entity';
import { TradingFill } from '../entities/trading-fill.entity';

import { MarketOrderbook } from '@chart/shared-types';
import { buildOrderbookLevels } from 'src/common/helpers/orderbook';

import { parseMarketCode } from 'src/common/helpers/market';
import { TradingPosition } from '../entities/trading-position.entity';
import Decimal from 'decimal.js-light';
import { TradingStreamService } from '../sse/trading-stream.service';
import {
  mapBalance,
  mapFillWithOrderId,
  mapOrder,
  mapPosition,
} from '../sse/trading-sse.mappers';
import { ExecutionCalculator } from '../domain/calculators/execution.calculator';
import { BuyOrderMatcher } from '../domain/matchers/buy-order.matcher';
import { SellOrderMatcher } from '../domain/matchers/sell-order.matcher';
import { BalanceManager } from './managers/balance.manager';
import { FillManager } from './managers/fill.manager';
import { PositionManager } from './managers/position.manager';
import {
  BuyExecution,
  MatchResult,
  OrderbookLevel,
  SellExecution,
} from '../domain/types/execution.types';
import { TradingLogger } from '../common/logging.helper';

type Resources = {
  balances: TradingBalance[];
  position: TradingPosition;
  currency: string;
  symbol: string;
};

@Injectable()
export class MatchingService {
  private readonly tradingLogger = new TradingLogger(MatchingService.name);

  constructor(
    private readonly ds: DataSource,
    private readonly stream: TradingStreamService,

    @InjectRepository(TradingOrder)
    private readonly orderRepo: Repository<TradingOrder>,

    // 도메인
    private readonly executionCalc: ExecutionCalculator,
    private readonly buyMatcher: BuyOrderMatcher,
    private readonly sellMatcher: SellOrderMatcher,

    // managers
    private readonly balanceManager: BalanceManager,
    private readonly positionManager: PositionManager,
    private readonly fillManager: FillManager,
  ) {}

  /**
   * 마켓 전체 체결 처리
   */
  async matchMarket(orderbook: MarketOrderbook, opts?: { maxOrders?: number }) {
    const startTime = Date.now();
    const market = orderbook.code.toUpperCase();
    const { asks, bids } = buildOrderbookLevels(orderbook);

    const bestAsk = asks[0]?.price ?? null;
    const bestBid = bids[0]?.price ?? null;

    if (!bestAsk && !bestBid) {
      this.tradingLogger.logMatchSkipped(market, 'empty orderbook');
      return { ok: true, market, matchedOrders: 0, fills: 0 };
    }

    const maxOrders = opts?.maxOrders ?? 50;

    // 체결 가능 주문 조회
    const [buyCandidates, sellCandidates] = await this.findMatchableOrders(
      market,
      bestAsk,
      bestBid,
      maxOrders,
    );

    const totalCandidates = buyCandidates.length + sellCandidates.length;

    if (totalCandidates === 0) {
      this.tradingLogger.logMatchSkipped(market, 'no matchable orders');
      return { ok: true, market, matchedOrders: 0, fills: 0 };
    }

    this.tradingLogger.logMatchStart(market, buyCandidates.length, sellCandidates.length);

    const asksMutable = asks.map((l) => ({ ...l }));
    const bidsMutable = bids.map((l) => ({ ...l }));

    let totalFills = 0;
    let matchedOrders = 0;

    try {
      // 매수 주문 처리
      for (const o of buyCandidates) {
        const res = await this.matchSingleOrder(o.id, asksMutable, bidsMutable);
        if (res.didMatch) matchedOrders += 1;
        totalFills += res.fills;
        if (asksMutable.every((lv) => lv.size.lte(0))) break;
      }

      // 매도 주문 처리
      for (const o of sellCandidates) {
        const res = await this.matchSingleOrder(o.id, asksMutable, bidsMutable);
        if (res.didMatch) matchedOrders += 1;
        totalFills += res.fills;
        if (bidsMutable.every((lv) => lv.size.lte(0))) break;
      }

      const duration = Date.now() - startTime;
      this.tradingLogger.logMatchComplete(market, matchedOrders, totalFills, duration);
      this.tradingLogger.logPerformance(`matchMarket(${market})`, duration);

      return { ok: true, market, matchedOrders, fills: totalFills };
    } catch (error) {
      this.tradingLogger.logMatchError(market, error);
      throw error;
    }
  }

  /**
   * 단일 주문 체결 (메인 로직)
   */
  private async matchSingleOrder(
    orderId: string,
    asks: OrderbookLevel[],
    bids: OrderbookLevel[],
  ) {
    const result = await this.ds.transaction(async (manager) => {
      // 1. 주문 조회
      const order = await this.getOrderWithLock(manager, orderId);
      if (!order || order.status !== 'OPEN') return null;

      // 시장가 매수는 금액 기준으로 체결
      let remaining: Decimal;
      let remainingAmount: Decimal | null = null;

      if (order.type === 'MARKET' && order.side === 'BUY') {
        // 시장가 매수: reservedAmount 기준
        if (!order.reservedAmount) {
          this.tradingLogger.log('MARKET BUY order missing reservedAmount, skipping');
          return null;
        }
        remainingAmount = new Decimal(order.reservedAmount);

        // qty가 0이면 무한대로 설정 (금액이 소진될 때까지)
        remaining = new Decimal(order.remainingQty).isZero()
          ? new Decimal(Number.MAX_SAFE_INTEGER)
          : new Decimal(order.remainingQty);
      } else {
        // 지정가 또는 시장가 매도: 수량 기준
        remaining = new Decimal(order.remainingQty);
        if (remaining.lte(0)) return null;
      }

      // 2. 리소스 준비 (잔고, 포지션)
      const resources = await this.prepareResources(manager, order);

      // 3. 체결 시도 (Domain 레이어에 위임)
      const matchResult =
        order.side === 'BUY'
          ? this.buyMatcher.match(
              {
                type: order.type,
                price: new Decimal(order.price),
                remainingQty: remaining,
                remainingAmount, // 🔧 추가: 시장가 매수용
              },
              asks,
            )
          : this.sellMatcher.match(
              {
                type: order.type,
                price: new Decimal(order.price),
                remainingQty: remaining,
              },
              bids,
            );

      // 체결 없으면 종료
      if (matchResult.fills.length === 0) return null;

      // 4. 체결 적용 (정산 계산 + 잔고/포지션 업데이트)
      const fills = await this.applyExecutions(order, matchResult, resources);

      // 5. 주문 상태 업데이트
      // 시장가 매수는 금액 기준으로 판단
      if (order.type === 'MARKET' && order.side === 'BUY') {
        // 사용한 금액 계산
        const usedAmount = matchResult.fills.reduce(
          (sum, fill) => sum.plus(fill.price.mul(fill.qty)),
          new Decimal('0'),
        );

        const totalReserved = new Decimal(order.reservedAmount || '0');
        const newRemainingAmount = totalReserved.minus(usedAmount);

        // 체결된 총 수량 업데이트
        const totalFilledQty = matchResult.fills.reduce(
          (sum, fill) => sum.plus(fill.qty),
          new Decimal(order.filledQty),
        );

        order.filledQty = totalFilledQty.toString();
        order.remainingQty = '0'; // 시장가 매수는 수량 개념 없음
        order.reservedAmount = newRemainingAmount.toString();

        // 금액이 소진되거나 더 이상 체결 불가
        if (newRemainingAmount.lte(0.01) || matchResult.remainingQty.lte(0)) {
          order.status = 'FILLED';
          order.filledAt = new Date();
          order.reservedAmount = '0';
        }
      } else {
        // 기존 로직 (지정가 or 매도)
        order.remainingQty = matchResult.remainingQty.toString();
        order.filledQty = new Decimal(order.filledQty)
          .plus(matchResult.totalFilled)
          .toString();

        if (matchResult.remainingQty.lte(0)) {
          order.status = 'FILLED';
          order.filledAt = new Date();
          if (order.side === 'BUY') {
            order.reservedAmount = '0';
          }
        }
      }

      // 6. DB 저장
      await this.persistResults(manager, order, resources, fills);

      return {
        userId: order.userId,
        order,
        fills,
        balances: resources.balances,
        position: resources.position,
        fillsCount: fills.length,
      };
    });

    // 7. 트랜잭션 후 이벤트 발행
    if (result) {
      this.tradingLogger.logOrderFilled(
        result.order.id,
        result.order.filledQty,
        result.order.remainingQty,
        result.order.status,
      );

      this.publishEvents(result);
    }

    return result
      ? { didMatch: true, fills: result.fillsCount }
      : { didMatch: false, fills: 0 };
  }

  /**
   * 체결 가능 주문 조회
   */
  private async findMatchableOrders(
    market: string,
    bestAsk: Decimal | null,
    bestBid: Decimal | null,
    maxOrders: number,
  ) {
    const [buyCandidates, sellCandidates] = await Promise.all([
      bestAsk
        ? this.orderRepo.find({
            select: ['id', 'createdAt', 'type'],
            where: {
              market,
              status: 'OPEN',
              side: 'BUY',
              // 시장가 매수도 포함 (price >= bestAsk OR type = MARKET)
            },
            order: {
              type: 'ASC',
              price: 'DESC',
              createdAt: 'ASC',
            },
            take: maxOrders * 2, // 여유있게
          })
        : Promise.resolve([]),

      bestBid
        ? this.orderRepo.find({
            select: ['id', 'createdAt', 'type'],
            where: {
              market,
              status: 'OPEN',
              side: 'SELL',
              price: LessThanOrEqual(bestBid.toString()),
            },
            order: {
              type: 'ASC',
              price: 'ASC',
              createdAt: 'ASC',
            },
            take: maxOrders,
          })
        : Promise.resolve([]),
    ]);

    // 매수 주문 필터링 (시장가 or 지정가 조건)
    const filteredBuyCandidates = buyCandidates
      .filter((o) => {
        if (o.type === 'MARKET') return true;
        // 지정가는 기존 로직 유지 (where 절에서 이미 필터됨)
        return true;
      })
      .slice(0, maxOrders);

    return [filteredBuyCandidates, sellCandidates];
  }

  /**
   * 주문 조회 + 락
   */
  private async getOrderWithLock(manager: EntityManager, orderId: string) {
    return manager.getRepository(TradingOrder).findOne({
      where: { id: orderId },
      lock: { mode: 'pessimistic_write' },
    });
  }

  /**
   * 리소스 준비 (잔고, 포지션)
   */
  private async prepareResources(manager: EntityManager, order: TradingOrder) {
    const { currency, symbol } = parseMarketCode(order.market);
    const userId = order.userId;

    // 잔고 조회 (데드락 방지: 정렬)
    const balances = await this.balanceManager.getMultipleWithLock(manager, userId, [
      currency,
      symbol,
    ]);

    // 포지션 조회
    const position = await this.positionManager.getOrCreateWithLock(
      manager,
      userId,
      order.market,
      symbol,
    );

    return {
      balances,
      position,
      currency,
      symbol,
    };
  }

  /**
   * 체결 적용 (정산 + 잔고/포지션 반영)
   */
  private async applyExecutions(
    order: TradingOrder,
    matchResult: MatchResult,
    resources: Resources,
  ): Promise<TradingFill[]> {
    const fills: TradingFill[] = [];

    const { balances, position, currency, symbol } = resources;
    const getBal = (ccy: string) =>
      balances.find((b: TradingBalance) => b.currency === ccy)!;

    for (const fillData of matchResult.fills) {
      // 정산 계산
      const execution =
        order.side === 'BUY'
          ? this.executionCalc.calculateBuyExecution({
              orderPrice: new Decimal(order.price),
              fillPrice: fillData.price,
              fillQty: fillData.qty,
              orderType: order.type,
            })
          : this.executionCalc.calculateSellExecution({
              fillPrice: fillData.price,
              fillQty: fillData.qty,
            });

      // 잔고 업데이트
      if (order.side === 'BUY') {
        this.applyBuyExecution(
          execution as BuyExecution,
          getBal(currency),
          getBal(symbol),
        );
      } else {
        this.applySellExecution(
          execution as SellExecution,
          getBal(currency),
          getBal(symbol),
        );
      }

      // 포지션 업데이트
      this.positionManager.applyFill(position, order.side, fillData.price, fillData.qty);

      // fill 생성
      fills.push(
        this.fillManager.create({
          orderId: order.id,
          userId: order.userId,
          market: order.market,
          side: order.side,
          price: fillData.price,
          qty: fillData.qty,
        }),
      );
    }

    return fills;
  }

  /**
   * 매수 체결 잔고 적용
   */
  private applyBuyExecution(
    execution: BuyExecution,
    krwBal: TradingBalance,
    coinBal: TradingBalance,
  ) {
    // 원화: locked 감소 + available 증가(환불)
    this.balanceManager.release(krwBal, execution.lockedAmount, execution.refund);

    // 코인: available 증가 (획득)
    this.balanceManager.increase(coinBal, execution.fillQty);
  }

  /**
   * 매도 체결 잔고 적용
   */
  private applySellExecution(
    execution: SellExecution,
    krwBal: TradingBalance,
    coinBal: TradingBalance,
  ) {
    // 코인: locked 감소
    this.balanceManager.decreaseLocked(coinBal, execution.fillQty);

    // 원화: available 증가
    this.balanceManager.increase(krwBal, execution.proceeds);
  }

  /**
   * db 저장
   */
  private async persistResults(
    manager: EntityManager,
    order: TradingOrder,
    resources: Resources,
    fills: TradingFill[],
  ) {
    await manager.save(TradingOrder, order);
    await manager.save(TradingBalance, resources.balances);
    await manager.save(TradingPosition, resources.position);
    await this.fillManager.saveAll(manager, fills);
  }

  /**
   * 이벤트 발행
   */
  private publishEvents(result: any) {
    const userId = result.userId;

    for (const f of result.fills) {
      this.stream.publishToUser(userId, { type: 'fill', data: mapFillWithOrderId(f) });
    }

    this.stream.publishToUser(userId, { type: 'order', data: mapOrder(result.order) });

    this.stream.publishToUser(userId, {
      type: 'balance',
      data: result.balances.map(mapBalance),
    });

    this.stream.publishToUser(userId, {
      type: 'position',
      data: mapPosition(result.position),
    });
  }
}
