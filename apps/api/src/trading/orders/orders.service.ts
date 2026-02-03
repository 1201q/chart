import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { TradingOrder } from '../entities/trading-order.entity';
import { TradingBalance } from '../entities/trading-balance.entity';
import { CreateOrderBodyDto, GetOrdersQueryDto } from './orders.dto';
import { TradingTestService } from '../trading.test.service';

import { D, parsePositiveDecimal } from 'src/common/helpers/decimal';
import { parseMarketCode } from 'src/common/helpers/market';
import { OrderbookStreamService } from 'src/realtime/orderbook/orderbook-stream.service';
import { MatchingService } from '../matching/matching.service';
import { ActiveMarketService } from '../matching/active-market.service';
import { TradingStreamService } from '../sse/trading-stream.service';
import { mapBalance, mapFill, mapOrder } from '../sse/trading-sse.mappers';
import Decimal from 'decimal.js-light';

@Injectable()
export class OrdersService {
  constructor(
    private readonly ds: DataSource,
    private readonly testService: TradingTestService,
    private readonly orderbooks: OrderbookStreamService,
    private readonly stream: TradingStreamService,

    private readonly matching: MatchingService,
    private readonly activeMarkets: ActiveMarketService,

    @InjectRepository(TradingOrder)
    private readonly orderRepo: Repository<TradingOrder>,

    @InjectRepository(TradingBalance)
    private readonly balRepo: Repository<TradingBalance>,
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

        // 호가창에서 최적 가격 조회
        const snapshot = this.orderbooks.getSnapshotByCode(market);
        if (!snapshot || !snapshot.units || snapshot.units.length === 0) {
          throw new BadRequestException('No orderbook available for market order');
        }

        const bestAsk = D(snapshot.units[0].askPrice.toString());

        // 예상 수량 계산 (실제 체결은 매칭 엔진에서)
        qty = totalAmount.div(bestAsk);
        price = bestAsk; // 참조용 (DB 저장용)
        reserveAmount = totalAmount;
      } else {
        // 시장가 매도: qty 필수
        // ----------------------------------------

        if (!dto.qty) {
          throw new BadRequestException(
            'MARKET SELL order requires qty (e.g., qty: "0.5")',
          );
        }

        qty = parsePositiveDecimal(dto.qty, 'qty');

        // 호가창에서 최적 가격 조회
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
      const balRepo = manager.getRepository(TradingBalance);
      const orderRepo = manager.getRepository(TradingOrder);

      // 1. 잔고 가져오기 + 예약처리
      // ===============================
      let bal = await balRepo.findOne({
        where: { userId, currency: reserveCurrency },
        lock: { mode: 'pessimistic_write' },
      });

      //  => 없다면 새로 생성함
      if (!bal) {
        bal = balRepo.create({
          userId,
          currency: reserveCurrency,
          available: '0',
          locked: '0',
        });

        await balRepo.save(bal);
      }

      // 2. 잔고체크 available >= reserveAmount
      if (D(bal.available).lt(reserveAmount)) {
        throw new BadRequestException(
          `Insufficient balance: need ${reserveAmount.toString()} ${reserveCurrency}, ` +
            `but only ${bal.available} available`,
        );
      }

      // 3. 잔고 이동: available => lock
      bal.available = D(bal.available).minus(reserveAmount).toString();
      bal.locked = D(bal.locked).plus(reserveAmount).toString();
      await balRepo.save(bal);

      // 4. 주문 생성
      const created = orderRepo.create({
        userId,
        market,
        side,
        type,

        // 시장가인 경우 price는 참조용 (실제 체결가는 매칭 엔진에서 결정)
        price: price.toString(),
        qty: qty.toString(),

        filledQty: '0',
        remainingQty: qty.toString(),
        status: 'OPEN',

        // buy => reserveAmount는 금액
        // sell => null을 저장
        reservedAmount: side === 'BUY' ? reserveAmount.toString() : null,

        canceledAt: null,
        filledAt: null,
      });

      // 5. 주문 저장
      const saved = await orderRepo.save(created);

      // 커밋 이후에 publish 하는 데이터
      return { order: saved, changedBalances: [bal] };
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
      const balRepo = manager.getRepository(TradingBalance);

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
      const remaining = D(order.remainingQty);

      if (remaining.lte(0)) {
        // remainingQty가 0이라면 filled여야 정상.
        throw new BadRequestException('No remaining quantity to cancel');
      }

      // 2. 해제할 자산, 금액 계산
      const reserveCurrency = order.side === 'BUY' ? currency : symbol;

      // buy => 금액 price * remainingQty 만큼 해제
      // sell => remainingQty 만큼 해제
      const releaseAmount =
        order.side === 'BUY' ? D(order.price).mul(remaining) : remaining;

      // 3. 잔고 락
      const bal = await balRepo.findOne({
        where: { userId, currency: reserveCurrency },
        lock: { mode: 'pessimistic_write' },
      });

      if (!bal) {
        // 데이터 깨짐 gg
        throw new BadRequestException('Balance not found for cancellation');
      }

      if (D(bal.locked).lt(releaseAmount)) {
        // realtime 체결로직이 locked를 이미 줄였을 가능성 있음.
        throw new BadRequestException('Locked balance is less than release amount');
      }

      // 4. locked => available
      bal.locked = D(bal.locked).minus(releaseAmount).toString();
      bal.available = D(bal.available).plus(releaseAmount).toString();
      await balRepo.save(bal);

      // 5. 주문 상태를 변경
      order.status = 'CANCELED';
      order.canceledAt = new Date();
      await orderRepo.save(order);

      return { order, changedBalances: [bal] };
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
