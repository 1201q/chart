import {
  UpbitCandleDefaultRaw,
  UpbitCandleSimpleRaw,
  UpbitCandleRaw,
  MarketCandle,
  UpbitRestCandleRaw,
} from './upbit-candle.types';
import {
  UpbitOrderbookDefaultRaw,
  UpbitOrderbookSimpleRaw,
  UpbitOrderbookRaw,
  MarketOrderbook,
  MarketOrderbookUnit,
} from './upbit-orderbook.types';
import { UpbitCandleType } from './upbit-shared.types';
import {
  UpbitTickerDefaultRaw,
  UpbitTickerSimpleRaw,
  UpbitTickerRaw,
  MarketTicker,
} from './upbit-ticker.types';
import {
  UpbitTradeDefaultRaw,
  UpbitTradeSimpleRaw,
  UpbitTradeRaw,
  MarketTrade,
} from './upbit-trade.types';

// ==================== TICKER ====================
// 1. SIMPLE_LIST → MarketTicker
export function mapUpbitTickerSimpleToMarketTicker(
  raw: UpbitTickerSimpleRaw,
): MarketTicker {
  return {
    code: raw.cd,

    openingPrice: raw.op,
    highPrice: raw.hp,
    lowPrice: raw.lp,
    tradePrice: raw.tp,
    prevClosingPrice: raw.pcp,

    change: raw.c,
    changePrice: raw.cp,
    signedChangePrice: raw.scp,
    changeRate: raw.cr,
    signedChangeRate: raw.scr,

    tradeVolume: raw.tv,
    accTradeVolume: raw.atv,
    accTradeVolume24h: raw.atv24h,
    accTradePrice: raw.atp,
    accTradePrice24h: raw.atp24h,

    tradeDateUtc: raw.tdt, // yyyyMMdd
    tradeTimeUtc: raw.ttm, // HHmmss
    tradeTimestamp: raw.ttms,

    askBid: raw.ab,
    accAskVolume: raw.aav,
    accBidVolume: raw.abv,

    highest52WeekPrice: raw.h52wp,
    highest52WeekDate: raw.h52wdt,
    lowest52WeekPrice: raw.l52wp,
    lowest52WeekDate: raw.l52wdt,

    marketState: raw.ms,
    isTradingSuspended: raw.its,
    delistingDate: raw.dd,
    marketWarning: raw.mw,

    timestamp: raw.tms,
    streamType: raw.st,
  };
}

// 2. DEFAULT → MarketTicker
export function mapUpbitTickerDefaultToMarketTicker(
  raw: UpbitTickerDefaultRaw,
): MarketTicker {
  return {
    code: raw.code,

    openingPrice: raw.opening_price,
    highPrice: raw.high_price,
    lowPrice: raw.low_price,
    tradePrice: raw.trade_price,
    prevClosingPrice: raw.prev_closing_price,

    change: raw.change,
    changePrice: raw.change_price,
    signedChangePrice: raw.signed_change_price,
    changeRate: raw.change_rate,
    signedChangeRate: raw.signed_change_rate,

    tradeVolume: raw.trade_volume,
    accTradeVolume: raw.acc_trade_volume,
    accTradeVolume24h: raw.acc_trade_volume_24h,
    accTradePrice: raw.acc_trade_price,
    accTradePrice24h: raw.acc_trade_price_24h,

    tradeDateUtc: raw.trade_date, // yyyyMMdd
    tradeTimeUtc: raw.trade_time, // HHmmss
    tradeTimestamp: raw.trade_timestamp,

    askBid: raw.ask_bid,
    accAskVolume: raw.acc_ask_volume,
    accBidVolume: raw.acc_bid_volume,

    highest52WeekPrice: raw.highest_52_week_price,
    highest52WeekDate: raw.highest_52_week_date,
    lowest52WeekPrice: raw.lowest_52_week_price,
    lowest52WeekDate: raw.lowest_52_week_date,

    marketState: raw.market_state,
    isTradingSuspended: raw.is_trading_suspended,
    delistingDate: raw.delisting_date,
    marketWarning: raw.market_warning,

    timestamp: raw.timestamp,
    streamType: raw.stream_type,
  };
}

// 3. RAW → MarketTicker
export function mapUpbitTickerRawToMarketTicker(raw: UpbitTickerRaw): MarketTicker {
  // SIMPLE_LIST인지 DEFAULT인지 구분
  if ('cd' in raw) {
    return mapUpbitTickerSimpleToMarketTicker(raw as UpbitTickerSimpleRaw);
  }
  return mapUpbitTickerDefaultToMarketTicker(raw as UpbitTickerDefaultRaw);
}

// ==================== TRADE ====================
// 1. SIMPLE_LIST → MarketTrade
export function mapUpbitTradeSimpleToMarketTrade(raw: UpbitTradeSimpleRaw): MarketTrade {
  return {
    code: raw.cd,

    tradePrice: raw.tp,
    tradeVolume: raw.tv,
    askBid: raw.ab,

    prevClosingPrice: raw.pcp,
    change: raw.c,
    changePrice: raw.cp,

    tradeDateUtc: raw.td, // yyyy-MM-dd
    tradeTimeUtc: raw.ttm, // HH:mm:ss
    tradeTimestamp: raw.ttms,

    timestamp: raw.tms,
    sequentialId: raw.sid,

    bestAskPrice: raw.bap,
    bestAskSize: raw.bas,
    bestBidPrice: raw.bbp,
    bestBidSize: raw.bbs,

    streamType: raw.st,
  };
}

// 2. DEFAULT → MarketTrade
export function mapUpbitTradeDefaultToMarketTrade(
  raw: UpbitTradeDefaultRaw,
): MarketTrade {
  return {
    code: raw.code,

    tradePrice: raw.trade_price,
    tradeVolume: raw.trade_volume,
    askBid: raw.ask_bid,

    prevClosingPrice: raw.prev_closing_price,
    change: raw.change,
    changePrice: raw.change_price,

    tradeDateUtc: raw.trade_date, // yyyy-MM-dd
    tradeTimeUtc: raw.trade_time, // HH:mm:ss
    tradeTimestamp: raw.trade_timestamp,

    timestamp: raw.timestamp,
    sequentialId: raw.sequential_id,

    bestAskPrice: raw.best_ask_price,
    bestAskSize: raw.best_ask_size,
    bestBidPrice: raw.best_bid_price,
    bestBidSize: raw.best_bid_size,

    streamType: raw.stream_type,
  };
}

// 3. RAW → MarketTrade
export function mapUpbitTradeRawToMarketTrade(raw: UpbitTradeRaw): MarketTrade {
  if ('cd' in raw) {
    return mapUpbitTradeSimpleToMarketTrade(raw as UpbitTradeSimpleRaw);
  }
  return mapUpbitTradeDefaultToMarketTrade(raw as UpbitTradeDefaultRaw);
}

// ==================== ORDERBOOK ====================
// 1. SIMPLE_LIST → MarketOrderbook
export function mapUpbitOrderbookSimpleToMarketOrderbook(
  raw: UpbitOrderbookSimpleRaw,
): MarketOrderbook {
  const units: MarketOrderbookUnit[] = raw.obu.map((u) => ({
    askPrice: u.ap,
    bidPrice: u.bp,
    askSize: u.as,
    bidSize: u.bs,
  }));

  return {
    code: raw.cd,
    totalAskSize: raw.tas,
    totalBidSize: raw.tbs,
    units,
    timestamp: raw.tms,
    level: raw.lv,
    streamType: raw.st,
  };
}

// 2. DEFAULT → MarketOrderbook
export function mapUpbitOrderbookDefaultToMarketOrderbook(
  raw: UpbitOrderbookDefaultRaw,
): MarketOrderbook {
  const units: MarketOrderbookUnit[] = raw.orderbook_units.map((u) => ({
    askPrice: u.ask_price,
    bidPrice: u.bid_price,
    askSize: u.ask_size,
    bidSize: u.bid_size,
  }));

  return {
    code: raw.code,
    totalAskSize: raw.total_ask_size,
    totalBidSize: raw.total_bid_size,
    units,
    timestamp: raw.timestamp,
    level: raw.level,
    streamType: raw.stream_type,
  };
}

// 3. RAW → MarketOrderbook
export function mapUpbitOrderbookRawToMarketOrderbook(
  raw: UpbitOrderbookRaw,
): MarketOrderbook {
  if ('cd' in raw) {
    return mapUpbitOrderbookSimpleToMarketOrderbook(raw as UpbitOrderbookSimpleRaw);
  }
  return mapUpbitOrderbookDefaultToMarketOrderbook(raw as UpbitOrderbookDefaultRaw);
}

// ==================== CANDLE ====================
// 1. SIMPLE_LIST → MarketCandle
export function mapUpbitCandleSimpleToMarketCandle(
  raw: UpbitCandleSimpleRaw,
): MarketCandle {
  return {
    code: raw.cd,
    type: raw.ty as UpbitCandleType,

    candleDateTimeUtc: raw.cdttmu,
    candleDateTimeKst: raw.cdttmk,

    openingPrice: raw.op,
    highPrice: raw.hp,
    lowPrice: raw.lp,
    tradePrice: raw.tp,

    candleAccTradeVolume: raw.catv,
    candleAccTradePrice: raw.catp,

    timestamp: raw.tms,
    streamType: raw.st,
  };
}

// 2. DEFAULT → MarketCandle
export function mapUpbitCandleDefaultToMarketCandle(
  raw: UpbitCandleDefaultRaw,
): MarketCandle {
  return {
    code: raw.code,
    type: raw.type,

    candleDateTimeUtc: raw.candle_date_time_utc,
    candleDateTimeKst: raw.candle_date_time_kst,

    openingPrice: raw.opening_price,
    highPrice: raw.high_price,
    lowPrice: raw.low_price,
    tradePrice: raw.trade_price,

    candleAccTradeVolume: raw.candle_acc_trade_volume,
    candleAccTradePrice: raw.candle_acc_trade_price,

    timestamp: raw.timestamp,
    streamType: raw.stream_type,
  };
}

// 3. RAW → MarketCandle
export function mapUpbitCandleRawToMarketCandle(raw: UpbitCandleRaw): MarketCandle {
  // SIMPLE 포맷은 ty / cdttmu / cdttmk
  if ('cdttmu' in raw) {
    // simple
    return mapUpbitCandleSimpleToMarketCandle(raw as UpbitCandleSimpleRaw);
  } else {
    // default
    return mapUpbitCandleDefaultToMarketCandle(raw as UpbitCandleDefaultRaw);
  }
}
