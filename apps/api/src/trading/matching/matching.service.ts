import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { TradingOrder } from '../entities/trading-order.entity';
import { MarketOrderbook } from '@chart/shared-types';
import { buildOrderbookLevels } from 'src/common/helpers/orderbook';
import { TradingStreamService } from '../sse/trading-stream.service';
import {
  mapBalance,
  mapFillWithOrderId,
  mapOrder,
  mapPosition,
} from '../sse/trading-sse.mappers';
import { TradingLogger } from '../common/logging.helper';
import {
  LimitBuyExecution,
  LimitSellExecution,
  MarketBuyExecution,
  MarketSellExecution,
  IOrderExecutionStrategy,
} from './strategies';

@Injectable()
export class MatchingService {
  private readonly tradingLogger = new TradingLogger(MatchingService.name);

  constructor(
    private readonly ds: DataSource,
    private readonly stream: TradingStreamService,

    @InjectRepository(TradingOrder)
    private readonly orderRepo: Repository<TradingOrder>,

    // 전략들
    private readonly limitBuyExecution: LimitBuyExecution,
    private readonly limitSellExecution: LimitSellExecution,
    private readonly marketBuyExecution: MarketBuyExecution,
    private readonly marketSellExecution: MarketSellExecution,
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
        const res = await this.matchSingleOrder(
          o.id,
          o.type,
          'BUY',
          asksMutable,
          bidsMutable,
        );
        if (res.didMatch) matchedOrders += 1;
        totalFills += res.fills;
        if (asksMutable.every((lv) => lv.size.lte(0))) break;
      }

      // 매도 주문 처리
      for (const o of sellCandidates) {
        const res = await this.matchSingleOrder(
          o.id,
          o.type,
          'SELL',
          asksMutable,
          bidsMutable,
        );
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
   * 단일 주문 체결 (전략 선택 후 위임)
   */
  private async matchSingleOrder(
    orderId: string,
    orderType: 'LIMIT' | 'MARKET',
    orderSide: 'BUY' | 'SELL',
    asks: any[],
    bids: any[],
  ) {
    const result = await this.ds.transaction(async (manager) => {
      // 1. 주문 조회
      const order = await this.getOrderWithLock(manager, orderId);
      if (!order || order.status !== 'OPEN') return null;

      // 2. 전략 선택
      const strategy = this.selectStrategy(orderType, orderSide);

      // 3. 전략 실행
      const executionResult = await strategy.execute(manager, order, asks, bids);

      return executionResult;
    });

    // 4. 트랜잭션 후 이벤트 발행
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
   * 전략 선택
   */
  private selectStrategy(
    orderType: 'LIMIT' | 'MARKET',
    orderSide: 'BUY' | 'SELL',
  ): IOrderExecutionStrategy {
    if (orderType === 'LIMIT' && orderSide === 'BUY') {
      return this.limitBuyExecution;
    }
    if (orderType === 'LIMIT' && orderSide === 'SELL') {
      return this.limitSellExecution;
    }
    if (orderType === 'MARKET' && orderSide === 'BUY') {
      return this.marketBuyExecution;
    }
    if (orderType === 'MARKET' && orderSide === 'SELL') {
      return this.marketSellExecution;
    }

    throw new Error(`Unsupported order type: ${orderType} ${orderSide}`);
  }

  /**
   * 체결 가능 주문 조회
   */
  private async findMatchableOrders(
    market: string,
    bestAsk: any,
    bestBid: any,
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
            },
            order: {
              type: 'ASC',
              price: 'DESC',
              createdAt: 'ASC',
            },
            take: maxOrders * 2,
          })
        : Promise.resolve([]),

      bestBid
        ? this.orderRepo.find({
            select: ['id', 'createdAt', 'type'],
            where: {
              market,
              status: 'OPEN',
              side: 'SELL',
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

    // 시장가는 모두 포함, 지정가는 가격 조건 필터
    const filteredBuyCandidates = buyCandidates
      .filter((o) => {
        if (o.type === 'MARKET') return true;
        // 지정가: where 절에서 필터링되지 않았으므로 여기서 체크 필요
        // 하지만 일단 모두 포함 (매칭 시 가격 체크)
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
   * 이벤트 발행
   */
  private publishEvents(result: any) {
    const userId = result.order.userId;

    for (const f of result.fills) {
      this.stream.publishToUser(userId, { type: 'fill', data: mapFillWithOrderId(f) });
    }

    this.stream.publishToUser(userId, { type: 'order', data: mapOrder(result.order) });

    this.stream.publishToUser(userId, {
      type: 'balance',
      data: result.changedBalances.map(mapBalance),
    });

    this.stream.publishToUser(userId, {
      type: 'position',
      data: mapPosition(result.changedPosition),
    });
  }
}
