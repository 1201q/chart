import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { TradingOrder } from '../entities/trading-order.entity';
import { TradingBalance } from '../entities/trading-balance.entity';
import { CreateOrderBodyDto, GetOrdersQueryDto } from './orders.dto';
import { TradingTestService } from '../trading.test.service';

import { D, parsePositiveDecimal, formatDecimal } from 'src/common/helpers/decimal';
import { parseMarketCode } from 'src/common/helpers/market';
import { now } from 'src/common/helpers/datetime';
import { OrderbookStreamService } from 'src/realtime/orderbook/orderbook-stream.service';
import { ActiveMarketService } from '../matching/active-market.service';
import { TradingStreamService } from '../sse/trading-stream.service';
import { mapBalance, mapFill, mapOrder } from '../sse/trading-sse.mappers';
import Decimal from 'decimal.js-light';

import { BalanceManager } from '../matching/managers/balance.manager';
import { TradingLogger } from '../common/logging.helper';

@Injectable()
export class OrdersService {
  private readonly tradingLogger = new TradingLogger(OrdersService.name);

  constructor(
    private readonly ds: DataSource,
    private readonly testService: TradingTestService,
    private readonly orderbooks: OrderbookStreamService,
    private readonly stream: TradingStreamService,

    private readonly activeMarkets: ActiveMarketService,

    @InjectRepository(TradingOrder)
    private readonly orderRepo: Repository<TradingOrder>,

    @InjectRepository(TradingBalance)
    private readonly balRepo: Repository<TradingBalance>,

    private readonly balanceManager: BalanceManager,
  ) {}

  async createOrder(dto: CreateOrderBodyDto) {
    const userId = await this.testService.getAdminUserId();

    const market = dto.market.toUpperCase();
    const side = dto.side;
    const type = dto.type;

    // ============================================
    // 요청 검증 및 파라미터 파싱
    // ============================================

    let price: Decimal;
    let qty: Decimal;
    let reserveAmount: Decimal;

    if (type === 'LIMIT') {
      // ============================================
      // 지정가 주문: price와 qty 필수
      // ============================================

      if (!dto.price || !dto.qty) {
        throw new BadRequestException('LIMIT order requires both price and qty');
      }

      price = parsePositiveDecimal(dto.price, 'price');
      qty = parsePositiveDecimal(dto.qty, 'qty');

      // 예약 금액 계산
      reserveAmount =
        side === 'BUY'
          ? price.mul(qty) // 매수: 금액 예약
          : qty; // 매도: 수량 예약
    } else {
      // ============================================
      // 시장가 주문
      // ============================================

      if (side === 'BUY') {
        // 시장가 매수: totalAmount 필수
        // ----------------------------------------

        if (!dto.totalAmount) {
          throw new BadRequestException('MARKET BUY order requires totalAmount');
        }

        const totalAmount = parsePositiveDecimal(dto.totalAmount, 'totalAmount');

        // 시장가 매수는 수량이 아닌 금액으로 관리
        // qty는 아주 작은 값으로 설정 (DB 제약 조건 회피: QTY > 0)
        // price는 아주 작은 값으로 설정 (체결 시 무시됨)
        qty = new Decimal('0.00000001');
        price = new Decimal('0.00000001');
        reserveAmount = totalAmount;

        this.tradingLogger.log(
          `MARKET BUY created with totalAmount=${formatDecimal(totalAmount)}, qty will be calculated during matching`,
        );
      } else {
        // 시장가 매도: qty 필수
        // ----------------------------------------

        if (!dto.qty) {
          throw new BadRequestException(
            'MARKET SELL order requires qty (e.g., qty: "0.5")',
          );
        }

        qty = parsePositiveDecimal(dto.qty, 'qty');

        // 호가창에서 최적 가격 조회 (참조용)
        const snapshot = this.orderbooks.getSnapshotByCode(market);
        if (!snapshot || !snapshot.units || snapshot.units.length === 0) {
          throw new BadRequestException('No orderbook available for market order');
        }

        const bestBid = D(snapshot.units[0].bidPrice.toString());
        price = bestBid; // 참조용 (DB 저장용)
        reserveAmount = qty; // 매도는 수량만 예약
      }
    }

    const { currency, symbol } = parseMarketCode(market);

    // 예약할 통화 결정
    const reserveCurrency = side === 'BUY' ? currency : symbol;

    const result = await this.ds.transaction(async (manager) => {
      const orderRepo = manager.getRepository(TradingOrder);

      // 1. 잔고 가져오기 + 예약처리
      // ===============================
      const balance = await this.balanceManager.getOrCreateWithLock(
        manager,
        userId,
        reserveCurrency,
      );

      // 2. 잔고 예약
      this.balanceManager.reserve(balance, reserveAmount);

      // 3. 주문 생성
      const created = orderRepo.create({
        userId,
        market,
        side,
        type,

        // formatDecimal 사용하여 8자리 제한
        price: formatDecimal(price),
        qty: formatDecimal(qty),

        filledQty: '0',
        remainingQty: formatDecimal(qty),
        status: 'OPEN',

        /**
         * reservedAmount:
         * - 매수 (지정가): price * qty
         * - 매수 (시장가): totalAmount (금액 기준)
         * - 매도: null (코인 수량은 balance.locked에서 관리)
         */
        reservedAmount: side === 'BUY' ? formatDecimal(reserveAmount) : null,

        canceledAt: null,
        filledAt: null,
      });

      // 4. 주문 저장
      const saved = await orderRepo.save(created);

      this.tradingLogger.logOrderCreated(
        saved.id,
        saved.market,
        saved.side,
        saved.type,
        saved.price,
        saved.qty,
      );

      await manager.save(TradingBalance, balance);

      // 커밋 이후에 publish 하는 데이터
      return { order: saved, changedBalances: [balance] };
    });

    // Active Market Set에 추가 (Repeatable Job이 체결 처리)
    this.activeMarkets.add(market);

    // 커밋 후 publish
    this.stream.publishToUser(userId, { type: 'order', data: mapOrder(result.order) });
    this.stream.publishToUser(userId, {
      type: 'balance',
      data: result.changedBalances.map(mapBalance),
    });

    return { ok: true, order: mapOrder(result.order) };
  }

  async cancelOrder(orderId: string) {
    const userId = await this.testService.getAdminUserId();

    const result = await this.ds.transaction(async (manager) => {
      const orderRepo = manager.getRepository(TradingOrder);

      // 1. 주문 row 락
      const order = await orderRepo.findOne({
        where: { id: orderId, userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!order) throw new NotFoundException('Order not found');

      if (order.status !== 'OPEN') {
        throw new BadRequestException(`Order is not OPEN (current: ${order.status})`);
      }

      const { currency, symbol } = parseMarketCode(order.market);

      // 2. 해제할 자산, 금액 계산
      // 시장가 매수의 경우 reservedAmount 사용
      const reserveCurrency = order.side === 'BUY' ? currency : symbol;
      let releaseAmount: Decimal;

      if (order.side === 'BUY') {
        if (order.type === 'LIMIT') {
          // 지정가 매수: price * remainingQty
          const remaining = D(order.remainingQty);
          if (remaining.lte(0)) {
            throw new BadRequestException('No remaining quantity to cancel');
          }
          releaseAmount = D(order.price).mul(remaining);
        } else {
          // 시장가 매수: 남은 예약 금액 계산
          if (!order.reservedAmount) {
            throw new BadRequestException('Missing reservedAmount for MARKET BUY');
          }

          // remainingAmount = 전체 예약액 - 이미 사용한 금액
          // 이미 사용한 금액은 체결 내역에서 계산 필요
          // 간단한 방법: reservedAmount에 남은 금액이 저장되어 있다고 가정
          releaseAmount = D(order.reservedAmount);

          this.tradingLogger.log(
            `Canceling MARKET BUY order, releasing remaining amount: ${formatDecimal(releaseAmount)}`,
          );
        }
      } else {
        // 매도: 수량만 환불
        const remaining = D(order.remainingQty);
        if (remaining.lte(0)) {
          throw new BadRequestException('No remaining quantity to cancel');
        }
        releaseAmount = remaining;
      }

      // 3. 잔고 락
      const balance = await this.balanceManager.getOrCreateWithLock(
        manager,
        userId,
        reserveCurrency,
      );

      // 4. locked => available
      this.balanceManager.restoreFromCancel(balance, releaseAmount);

      this.tradingLogger.logBalanceRestored(reserveCurrency, releaseAmount);

      // 5. 주문 상태를 변경
      order.status = 'CANCELED';
      order.canceledAt = now(); // UTC 시간

      // 6. 저장
      await orderRepo.save(order);
      await manager.save(TradingBalance, balance);

      this.tradingLogger.logOrderCanceled(orderId, order.market);

      return { order, changedBalances: [balance] };
    });

    // 커밋 후 publish
    this.stream.publishToUser(userId, { type: 'order', data: mapOrder(result.order) });
    this.stream.publishToUser(userId, {
      type: 'balance',
      data: result.changedBalances.map(mapBalance),
    });

    return { ok: true };
  }

  async getMyOrders(query: GetOrdersQueryDto) {
    const userId = await this.testService.getAdminUserId();

    const market = query.market?.toUpperCase();
    const viewType = query.view;

    const rows = await this.orderRepo.find({
      where: {
        userId,
        ...(market ? { market } : {}),
        ...(viewType === 'pending'
          ? { status: 'OPEN' }
          : viewType === 'completed'
            ? { status: In(['FILLED', 'CANCELED']) }
            : {}),
      },
      relations: { fills: true },
      order: { createdAt: 'DESC' },
    });

    const result = rows.map((o) => ({
      ...mapOrder(o),
      fills: o.fills.map((f) => mapFill(f)),
    }));

    return { ok: true, orders: result };
  }
}
