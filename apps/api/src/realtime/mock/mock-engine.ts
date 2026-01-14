import { MarketOrderbook, MarketTradeWithId, MarketTicker } from '@chart/shared-types';

import {
  UpbitAskBid,
  UpbitChange,
  UpbitMarketState,
  UpbitStreamType,
} from '@chart/shared-types';

type ScenarioConfig = {
  scenario: string;
  baseTs: number; // 고정된 가상 시작 시간
  stepMs: number; // tick 간격

  liquidityByCode?: Record<string, number>; // accTradePrice24h 시드
};

function hash32(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function utcDateTime(ts: number) {
  const d = new Date(ts);
  const tradeDateUtc = `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
  const tradeTimeUtc = `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`;
  return { tradeDateUtc, tradeTimeUtc };
}

function clampMin(n: number, min = 1) {
  return n < min ? min : n;
}

export class MockMarketEngine {
  private rng: () => number;

  private tick = 0;
  private seq = 0;

  // state
  private openingPrice: number;
  private prevClosingPrice: number;
  private tradePrice: number;
  private highPrice: number;
  private lowPrice: number;

  private accTradeVolume = 0;
  private accTradeVolume24h = 0;
  private accTradePrice = 0;
  private accTradePrice24h = 0;

  private accAskVolume = 0;
  private accBidVolume = 0;

  private bestAskPrice: number;
  private bestAskSize: number;
  private bestBidPrice: number;
  private bestBidSize: number;

  constructor(
    private readonly code: string,
    private readonly cfg: ScenarioConfig,
  ) {
    // scenario+code로 seed 고정 => 언제 시작해도 동일
    const seed = hash32(`${cfg.scenario}|${code}`);
    this.rng = mulberry32(seed);

    // 초기값도 seed 기반
    const base = 1000000 + Math.floor(this.rng() * 200000); // 시작가
    this.openingPrice = base;
    this.prevClosingPrice = base * (0.995 + this.rng() * 0.01); // 약간 차이
    this.tradePrice = base;
    this.highPrice = base;
    this.lowPrice = base;

    const notional24h = this.cfg.liquidityByCode?.[this.code] ?? 0;
    this.accTradePrice24h = Math.floor(notional24h);
    this.accTradeVolume24h =
      this.accTradePrice24h > 0
        ? +(this.accTradePrice24h / this.tradePrice).toFixed(6)
        : 0;
    this.accTradePrice = this.accTradePrice24h;
    this.accTradeVolume = this.accTradeVolume24h;

    // 초기 베스트호가
    const step = this.priceStep(base);
    this.bestAskPrice = base + step;
    this.bestBidPrice = clampMin(base - step);
    this.bestAskSize = 0.1 + this.rng() * 2;
    this.bestBidSize = 0.1 + this.rng() * 2;
  }

  private priceStep(p: number) {
    return Math.max(1, Math.floor(p * 0.0005));
  }

  private nextPrice() {
    // ±0.1% 랜덤워크 (결정론 RNG)
    const r = (this.rng() - 0.5) * 0.002;
    return clampMin(Math.floor(this.tradePrice * (1 + r)));
  }

  private calcChange(now: number, prevClose: number) {
    const diff = now - prevClose;
    const signedChangePrice = diff;
    const signedChangeRate = prevClose === 0 ? 0 : diff / prevClose;

    let change: UpbitChange = 'EVEN' as any;
    if (diff > 0) change = 'RISE' as any;
    if (diff < 0) change = 'FALL' as any;

    return {
      change,
      changePrice: Math.abs(diff),
      signedChangePrice,
      changeRate: Math.abs(signedChangeRate),
      signedChangeRate,
    };
  }

  /** tick 0 스냅샷용 */
  snapshotTicker(streamType: UpbitStreamType = 'SNAPSHOT' as any) {
    return this.buildTicker(this.cfg.baseTs, streamType);
  }

  snapshotOrderbook(streamType: UpbitStreamType = 'SNAPSHOT' as any) {
    return this.buildOrderbook(this.cfg.baseTs, streamType);
  }

  snapshotTrades(count = 50): MarketTradeWithId[] {
    //  “항상 동일한 최근 체결”이 필요하면, 엔진을 복제해서 count만큼 advance
    const tmp = new MockMarketEngine(this.code, this.cfg);
    const out: MarketTradeWithId[] = [];
    for (let i = 0; i < count; i++) out.unshift(tmp.nextTrade()); // 최신이 앞
    return out;
  }

  /** SSE 한 틱 진행(필요하면 ticker/orderbook/trade 각각 따로 보내도 됨) */
  step() {
    this.tick += 1;
    this.seq += 1;

    const ts = this.cfg.baseTs + this.tick * this.cfg.stepMs;

    // price update
    this.tradePrice = this.nextPrice();
    this.highPrice = Math.max(this.highPrice, this.tradePrice);
    this.lowPrice = Math.min(this.lowPrice, this.tradePrice);

    // trade volume update
    const max = 4.5e11;
    const baseNotional24h = this.cfg.liquidityByCode?.[this.code] ?? 1e8;
    const liquidityScale = Math.min(1, Math.max(0, baseNotional24h / max));

    const vol = +((0.01 + this.rng() * 0.5) * (0.25 + 3.0 * liquidityScale)).toFixed(6);
    this.accTradeVolume += vol;
    this.accTradeVolume24h += vol;

    this.accTradePrice += this.tradePrice * vol;
    this.accTradePrice24h += this.tradePrice * vol;

    // ask/bid 결정 (결정론)
    const askBid: UpbitAskBid = (this.rng() > 0.5 ? 'BID' : 'ASK') as any;
    if (askBid === ('ASK' as any)) this.accAskVolume += vol;
    else this.accBidVolume += vol;

    // best 호가도 살짝 흔들기
    const step = this.priceStep(this.tradePrice);
    this.bestAskPrice = this.tradePrice + step;
    this.bestBidPrice = clampMin(this.tradePrice - step);
    this.bestAskSize = 0.1 + this.rng() * 2;
    this.bestBidSize = 0.1 + this.rng() * 2;

    const ticker = this.buildTicker(ts, 'REALTIME' as any);
    const orderbook = this.buildOrderbook(ts, 'REALTIME' as any);
    const trade = this.buildTrade(ts, askBid, vol, 'REALTIME' as any);

    return { ts, ticker, orderbook, trade };
  }

  /** trade만 필요하면 */
  nextTrade(): MarketTradeWithId {
    this.step();

    const ts = this.cfg.baseTs + this.tick * this.cfg.stepMs;
    const vol = +(0.01 + this.rng() * 0.5).toFixed(6);
    const askBid: UpbitAskBid = (this.rng() > 0.5 ? 'BID' : 'ASK') as any;
    return this.buildTrade(ts, askBid, vol, 'REALTIME' as any);
  }

  private buildTicker(ts: number, streamType: UpbitStreamType): MarketTicker {
    const { tradeDateUtc, tradeTimeUtc } = utcDateTime(ts);
    const ch = this.calcChange(this.tradePrice, this.prevClosingPrice);

    // 52주: 그냥 결정론 상수처럼
    const highest52WeekPrice = this.prevClosingPrice * 1.5;
    const lowest52WeekPrice = this.prevClosingPrice * 0.5;

    return {
      code: this.code,

      openingPrice: this.openingPrice,
      highPrice: this.highPrice,
      lowPrice: this.lowPrice,
      tradePrice: this.tradePrice,
      prevClosingPrice: this.prevClosingPrice,

      change: ch.change,
      changePrice: ch.changePrice,
      signedChangePrice: ch.signedChangePrice,
      changeRate: ch.changeRate,
      signedChangeRate: ch.signedChangeRate,

      tradeVolume: 0, // 업비트 ticker의 tradeVolume은 “최근 1회 체결량” 느낌이면 step()에서 넣어도 됨
      accTradeVolume: this.accTradeVolume,
      accTradeVolume24h: this.accTradeVolume24h,
      accTradePrice: this.accTradePrice,
      accTradePrice24h: this.accTradePrice24h,

      tradeDateUtc,
      tradeTimeUtc,
      tradeTimestamp: ts,

      askBid: 'BID' as any, // ticker에선 의미 없음.
      accAskVolume: this.accAskVolume,
      accBidVolume: this.accBidVolume,

      highest52WeekPrice,
      highest52WeekDate: tradeDateUtc,
      lowest52WeekPrice,
      lowest52WeekDate: tradeDateUtc,

      marketState: 'ACTIVE' as any as UpbitMarketState,
      isTradingSuspended: false,
      delistingDate: null,
      marketWarning: undefined,

      timestamp: ts,
      streamType,
    };
  }

  private buildOrderbook(ts: number, streamType: UpbitStreamType): MarketOrderbook {
    const level = 30;
    const step = this.priceStep(this.tradePrice);

    const units = Array.from({ length: level }, (_, i) => {
      const askPrice = this.tradePrice + step * (i + 1);
      const bidPrice = clampMin(this.tradePrice - step * (i + 1));
      const askSize = 0.1 + this.rng() * 2;
      const bidSize = 0.1 + this.rng() * 2;
      return { askPrice, bidPrice, askSize, bidSize };
    });

    const totalAskSize = units.reduce((a, u) => a + u.askSize, 0);
    const totalBidSize = units.reduce((a, u) => a + u.bidSize, 0);

    return {
      code: this.code,
      totalAskSize,
      totalBidSize,
      units,
      timestamp: ts,
      level,
      streamType,
    };
  }

  private buildTrade(
    ts: number,
    askBid: UpbitAskBid,
    tradeVolume: number,
    streamType: UpbitStreamType,
  ): MarketTradeWithId {
    const { tradeDateUtc, tradeTimeUtc } = utcDateTime(ts);
    const ch = this.calcChange(this.tradePrice, this.prevClosingPrice);

    const t: MarketTradeWithId = {
      id: `${this.cfg.scenario}|${this.code}|${this.seq}`, // 항상 동일한 순서/ID
      code: this.code,

      tradePrice: this.tradePrice,
      tradeVolume,
      askBid,

      prevClosingPrice: this.prevClosingPrice,
      change: ch.change,
      changePrice: ch.changePrice,

      tradeDateUtc,
      tradeTimeUtc,
      tradeTimestamp: ts,
      timestamp: ts,

      sequentialId: this.seq,

      bestAskPrice: this.bestAskPrice,
      bestAskSize: this.bestAskSize,
      bestBidPrice: this.bestBidPrice,
      bestBidSize: this.bestBidSize,

      streamType,
    };

    return t;
  }
}
