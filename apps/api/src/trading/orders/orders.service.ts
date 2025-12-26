import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TradingOrder } from '../entities/trading-order.entity';
import { TradingBalance } from '../entities/trading-balance.entity';
import { CreateOrderDto, GetOrdersQueryDto } from './orders.dto';
import { TradingTestService } from '../trading.test.service';

import { D, parsePositiveDecimal } from 'src/common/helpers/decimal';
import { parseMarketCode } from 'src/common/helpers/market';
import { OrderbookStreamService } from 'src/realtime/orderbook/orderbook-stream.service';
import { MatchingService } from '../matching/matching.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly ds: DataSource,
    private readonly testService: TradingTestService,
    private readonly orderbooks: OrderbookStreamService,

    private readonly matching: MatchingService,

    @InjectRepository(TradingOrder)
    private readonly orderRepo: Repository<TradingOrder>,

    @InjectRepository(TradingBalance)
    private readonly balRepo: Repository<TradingBalance>,
  ) {}

  async createOrder(dto: CreateOrderDto) {
    const userId = await this.testService.getAdminUserId();

    const market = dto.market.toUpperCase();
    const side = dto.side;
    const type = dto.type;

    const price = parsePositiveDecimal(dto.price, 'price');
    const qty = parsePositiveDecimal(dto.qty, 'qty');

    const { currency, symbol } = parseMarketCode(market);

    // buy => KRW를 예약함
    // Sell => symbol을 예약함
    const reserveCurrency = side === 'BUY' ? currency : symbol;

    // buy => 금액
    // sell => 수량
    const reserveAmount = side === 'BUY' ? price.mul(qty) : qty;

    const order = await this.ds.transaction(async (manager) => {
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
          `Insufficient balance: ${reserveAmount.toString()} ${reserveCurrency}`,
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
        //
        price: price.toString(),
        qty: qty.toString(),
        //
        filledQty: '0',
        remainingQty: qty.toString(),
        status: 'OPEN',

        // buy => reserveAmount는 금액
        // sell => null을 저장
        reservedAmount: side === 'BUY' ? reserveAmount.toString() : null,

        canceledAt: null,
        filledAt: null,
      });

      return await orderRepo.save(created);
    });

    // const snapshot = this.orderbooks.getSnapshotByCode(order.market);
    // if (snapshot) {
    //   await this.matching.matchMarket(snapshot, { maxOrders: 50 });
    // }

    return { ok: true, order };
  }

  async cancelOrder(orderId: string) {
    const userId = await this.testService.getAdminUserId();

    await this.ds.transaction(async (manager) => {
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
    });

    return { ok: true };
  }

  async getMyOrders(query: GetOrdersQueryDto) {
    const userId = await this.testService.getAdminUserId();

    const { market, status } = query;

    const rows = await this.orderRepo.find({
      where: {
        userId,
        ...(market ? { market: market.toUpperCase() } : {}),
        ...(status ? { status } : {}),
      },
      order: { createdAt: 'DESC' },
      take: 200,
    });

    return { ok: true, orders: rows };
  }
}
