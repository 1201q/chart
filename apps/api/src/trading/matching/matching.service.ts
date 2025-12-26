import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { TradingOrder } from '../entities/trading-order.entity';
import { TradingBalance } from '../entities/trading-balance.entity';
import { TradingFill } from '../entities/trading-fill.entity';

import { MarketOrderbook } from '@chart/shared-types';
import { buildOrderbookLevels, OrderbookLevel } from 'src/common/helpers/orderbook';
import { D, DecimalMin } from 'src/common/helpers/decimal';
import { parseMarketCode } from 'src/common/helpers/market';

const MOCK: MarketOrderbook = {
  code: 'KRW-BTC',
  totalAskSize: 6.56821581,
  totalBidSize: 6.36388549,
  units: [
    {
      askPrice: 128491000,
      bidPrice: 128490000,
      askSize: 0.02532924,
      bidSize: 0.28359086,
    },
    {
      askPrice: 128494000,
      bidPrice: 128489000,
      askSize: 0.01541412,
      bidSize: 0.05605766,
    },
    {
      askPrice: 128495000,
      bidPrice: 128488000,
      askSize: 2.77953306,
      bidSize: 0.00155579,
    },
    {
      askPrice: 128497000,
      bidPrice: 128487000,
      askSize: 0.10556197,
      bidSize: 0.00915086,
    },
    {
      askPrice: 128498000,
      bidPrice: 128486000,
      askSize: 0.46280062,
      bidSize: 0.01877282,
    },
    {
      askPrice: 128500000,
      bidPrice: 128485000,
      askSize: 0.60982224,
      bidSize: 0.00594011,
    },
    {
      askPrice: 128526000,
      bidPrice: 128484000,
      askSize: 0.00778223,
      bidSize: 0.00238915,
    },
    {
      askPrice: 128563000,
      bidPrice: 128482000,
      askSize: 0.10288259,
      bidSize: 0.0000779,
    },
    {
      askPrice: 128564000,
      bidPrice: 128481000,
      askSize: 0.00007779,
      bidSize: 0.00238069,
    },
    {
      askPrice: 128565000,
      bidPrice: 128480000,
      askSize: 0.37719952,
      bidSize: 0.04215243,
    },
    {
      askPrice: 128566000,
      bidPrice: 128479000,
      askSize: 0.05649329,
      bidSize: 0.01467525,
    },
    {
      askPrice: 128568000,
      bidPrice: 128478000,
      askSize: 0.04802199,
      bidSize: 0.00007783,
    },
    {
      askPrice: 128590000,
      bidPrice: 128475000,
      askSize: 0.00003967,
      bidSize: 0.00634334,
    },
    {
      askPrice: 128591000,
      bidPrice: 128474000,
      askSize: 0.00404429,
      bidSize: 0.00015963,
    },
    {
      askPrice: 128593000,
      bidPrice: 128471000,
      askSize: 0.00038883,
      bidSize: 0.00210161,
    },
    {
      askPrice: 128594000,
      bidPrice: 128470000,
      askSize: 0.07776413,
      bidSize: 0.03,
    },
    {
      askPrice: 128596000,
      bidPrice: 128467000,
      askSize: 0.00077956,
      bidSize: 0.00128,
    },
    {
      askPrice: 128598000,
      bidPrice: 128464000,
      askSize: 0.1107,
      bidSize: 0.01293666,
    },
    {
      askPrice: 128600000,
      bidPrice: 128463000,
      askSize: 0.1525007,
      bidSize: 0.00380103,
    },
    {
      askPrice: 128602000,
      bidPrice: 128462000,
      askSize: 0.01010871,
      bidSize: 0.00295874,
    },
    {
      askPrice: 128607000,
      bidPrice: 128461000,
      askSize: 0.25725891,
      bidSize: 0.01245513,
    },
    {
      askPrice: 128609000,
      bidPrice: 128460000,
      askSize: 0.05526,
      bidSize: 0.00019568,
    },
    {
      askPrice: 128610000,
      bidPrice: 128459000,
      askSize: 0.00007776,
      bidSize: 0.00007784,
    },
    {
      askPrice: 128611000,
      bidPrice: 128450000,
      askSize: 1.20649629,
      bidSize: 0.03504082,
    },
    {
      askPrice: 128618000,
      bidPrice: 128445000,
      askSize: 0.03435204,
      bidSize: 0.00859945,
    },
    {
      askPrice: 128620000,
      bidPrice: 128443000,
      askSize: 0.0001555,
      bidSize: 0.00045571,
    },
    {
      askPrice: 128624000,
      bidPrice: 128440000,
      askSize: 0.01195618,
      bidSize: 0.00171389,
    },
    {
      askPrice: 128625000,
      bidPrice: 128438000,
      askSize: 0.02252749,
      bidSize: 0.05039926,
    },
    {
      askPrice: 128628000,
      bidPrice: 128437000,
      askSize: 0.029,
      bidSize: 5.753173,
    },
    {
      askPrice: 128631000,
      bidPrice: 128435000,
      askSize: 0.00388709,
      bidSize: 0.00537235,
    },
  ],
  timestamp: 1766713340974,
  level: 0,
  streamType: 'REALTIME',
};

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    private readonly ds: DataSource,

    @InjectRepository(TradingOrder)
    private readonly orderRepo: Repository<TradingOrder>,

    @InjectRepository(TradingBalance)
    private readonly balRepo: Repository<TradingBalance>,

    @InjectRepository(TradingFill)
    private readonly fillRepo: Repository<TradingFill>,
  ) {}

  /**
   * market 1개의 open 주문들을 orderbook snapshot 기준으로 매칭 처리
   * db에서 꺼낸 주문을 순차 처리함.
   */
  async matchMarket(orderbook: MarketOrderbook, opts?: { maxOrders?: number }) {
    const market = orderbook.code.toUpperCase();
    const { asks, bids } = buildOrderbookLevels(orderbook);

    const bestAsk = asks[0]?.price ?? null;
    const bestBid = bids[0]?.price ?? null;

    if (!bestAsk && !bestBid) {
      return { ok: true, market, matchedOrders: 0, fills: 0 };
    }

    // 테스트용
    const maxOrders = opts?.maxOrders ?? 50;

    // 1. 체결 가능 후보주문을 db에서 뽑기
    // buy => price >= bestAsk, sell : price <= bestBid
    const [buyCandidates, sellCandidates] = await Promise.all([
      bestAsk
        ? this.orderRepo.find({
            select: ['id', 'createdAt'],
            where: {
              market,
              status: 'OPEN',
              side: 'BUY',
              price: MoreThanOrEqual(bestAsk.toString()),
            },
            order: { price: 'DESC', createdAt: 'ASC' },
            take: maxOrders,
          })
        : Promise.resolve([]),

      bestBid
        ? this.orderRepo.find({
            select: ['id', 'createdAt'],
            where: {
              market,
              status: 'OPEN',
              side: 'SELL',
              price: LessThanOrEqual(bestBid.toString()),
            },
            order: { price: 'ASC', createdAt: 'ASC' },
            take: maxOrders,
          })
        : Promise.resolve([]),
    ]);

    const asksMutable = asks.map((l) => ({ ...l }));
    const bidsMutable = bids.map((l) => ({ ...l }));

    let totalFills = 0;
    let matchedOrders = 0;

    // 2. buy, sell 주문을 처리
    for (const o of buyCandidates) {
      const res = await this.matchSingleOrder(o.id, asksMutable, bidsMutable);
      if (res.didMatch) matchedOrders += 1;
      totalFills += res.fills;
      if (asksMutable.every((lv) => lv.size.lte(0))) break; // ask 유동성이 없음.
    }

    for (const o of sellCandidates) {
      const res = await this.matchSingleOrder(o.id, asksMutable, bidsMutable);
      if (res.didMatch) matchedOrders += 1;
      totalFills += res.fills;
      if (bidsMutable.every((lv) => lv.size.lte(0))) break; // 더 먹을 bid 유동성 없음
    }

    return { ok: true, market, matchedOrders, fills: totalFills };
  }

  private async matchSingleOrder(
    orderId: string,
    asks: OrderbookLevel[],
    bids: OrderbookLevel[],
  ) {
    return this.ds.transaction(async (manager) => {
      const orderRepo = manager.getRepository(TradingOrder);
      const fillRepo = manager.getRepository(TradingFill);
      const balRepo = manager.getRepository(TradingBalance);

      const order = await orderRepo.findOne({
        where: { id: orderId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!order) return { didMatch: false, fills: 0 };
      if (order.status !== 'OPEN') return { didMatch: false, fills: 0 };

      const remaining = D(order.remainingQty);
      if (remaining.lte(0)) return { didMatch: false, fills: 0 };

      const { currency, symbol } = parseMarketCode(order.market);
      const userId = order.userId;

      // 2. 필요한 balance 2개락 + 없다면 생성
      const [curA, curB] = [currency, symbol].sort();
      console.log(curA, curB);

      const balA = await this.getOrCreateBalanceWithLock(balRepo, userId, curA);
      const balB = await this.getOrCreateBalanceWithLock(balRepo, userId, curB);
      //
      const getBal = (ccy: string) => (balA.currency === ccy ? balA : balB);

      const limitPrice = D(order.price);

      const fills: TradingFill[] = [];
      let fillsCount = 0;

      let newRemaining = remaining;
      let newFilled = D(order.filledQty);

      // order BUY | SELL 처리
      // ========================

      if (order.side === 'BUY') {
        // buy => asks를 저렴한 가격부터 돌면서 매칭 시도
        for (const level of asks) {
          if (newRemaining.lte(0)) break; // 다 채워져
          if (level.size.lte(0)) continue; // 이 레벨엔 유동성 없음

          // askPrice <= limitPrice
          if (level.price.gt(limitPrice)) break;

          // 체결 체크 min(남은수량, 현재 레벨사이즈)
          const fillQty = DecimalMin(newRemaining, level.size);
          if (fillQty.lte(0)) continue; // 채울게 없음

          // 체결이 진행======>

          // 체결할 가격
          const fillPrice = level.price;

          // lockedSpend = limitPrice * fillQty
          const lockedSpend = limitPrice.mul(fillQty); // 주문시 잠금할 금액
          const refund = limitPrice.minus(fillPrice).mul(fillQty); // 환불 금액

          const krwBal = getBal(currency);
          const coinBal = getBal(symbol);

          if (D(krwBal.locked).lt(lockedSpend)) {
            throw new BadRequestException('KRW locked is less than required spend');
          }

          // 잔고 정산 (잠금해제 + 사용 + 코인증가)
          krwBal.locked = D(krwBal.locked).minus(lockedSpend).toString();
          krwBal.available = D(krwBal.available).plus(refund).toString();
          coinBal.available = D(coinBal.available).plus(fillQty).toString();

          // 주문 수량을 업데이트
          newRemaining = newRemaining.minus(fillQty);
          newFilled = newFilled.plus(fillQty);

          // 레벨 사이즈 차감
          level.size = level.size.minus(fillQty);

          fills.push(
            fillRepo.create({
              orderId: order.id,
              userId,
              market: order.market,
              side: 'BUY',
              price: fillPrice.toString(),
              qty: fillQty.toString(),
            }),
          );
          fillsCount += 1;
        }

        order.reservedAmount = limitPrice.mul(newRemaining).toString();
      } else {
        // sell => bids를 높은 가격부터 돌면서 매칭 시도

        for (const level of bids) {
          if (newRemaining.lte(0)) break; // 다 채워져
          if (level.size.lte(0)) continue; // 이 레벨엔 유동성 없음

          // bidPrice >= limitPrice
          if (level.price.lt(limitPrice)) break;

          // 체결 체크 min(남은수량, 현재 레벨사이즈)
          const fillQty = DecimalMin(newRemaining, level.size);
          if (fillQty.lte(0)) continue; // 채울게 없음

          // 체결이 진행======>

          // 체결할 가격
          const fillPrice = level.price;
          const proceeds = fillPrice.mul(fillQty);

          const krwBal = getBal(currency);
          const coinBal = getBal(symbol);

          if (D(coinBal.locked).lt(fillQty)) {
            throw new BadRequestException('Coin locked is less than fillQty');
          }

          // 잔고 정산
          coinBal.locked = D(coinBal.locked).minus(fillQty).toString();
          krwBal.available = D(krwBal.available).plus(proceeds).toString();

          // 주문 수량을 업데이트
          newRemaining = newRemaining.minus(fillQty);
          newFilled = newFilled.plus(fillQty);

          // 레벨 사이즈 차감
          level.size = level.size.minus(fillQty);

          fills.push(
            fillRepo.create({
              orderId: order.id,
              userId,
              market: order.market,
              side: 'SELL',
              price: fillPrice.toString(),
              qty: fillQty.toString(),
            }),
          );
          fillsCount += 1;
        }
      }

      if (fillsCount === 0) {
        return { didMatch: false, fills: 0 };
      }

      // 3. 주문 row 업데이트
      order.remainingQty = newRemaining.toString();
      order.filledQty = newFilled.toString();

      if (newRemaining.lte(0)) {
        order.status = 'FILLED';
        order.filledAt = new Date();

        if (order.side === 'BUY') {
          order.reservedAmount = '0';
        }
      }

      // 4. db저장
      await fillRepo.save(fills);
      await orderRepo.save(order);
      await balRepo.save([balA, balB]);

      return { didMatch: true, fills: fillsCount };
    });
  }

  private async getOrCreateBalanceWithLock(
    balRepo: Repository<TradingBalance>,
    userId: string,
    currency: string,
  ) {
    let bal = await balRepo.findOne({
      where: { userId, currency },
      lock: { mode: 'pessimistic_write' },
    });

    if (!bal) {
      bal = balRepo.create({
        userId,
        currency,
        available: '0',
        locked: '0',
      });
      await balRepo.save(bal);

      bal = await balRepo.findOne({
        where: { userId, currency },
        lock: { mode: 'pessimistic_write' },
      });

      if (!bal) {
        throw new BadRequestException('Failed to create balance');
      }
    }

    return bal;
  }
}
