import { UpbitStreamType, UpbitCandleType } from './upbit-shared.types';

/** raw 타입
========================================
 */
export interface UpbitCandleSimpleRaw {
  // candle.1s / candle.1m / ... / candle.240m
  ty: UpbitCandleType;

  // 마켓 코드 (예: "KRW-BTC")
  cd: string;

  // 캔들 기준 시각(UTC, yyyy-MM-dd'T'HH:mm:ss)
  cdttmu: string;

  // 캔들 기준 시각(KST, yyyy-MM-dd'T'HH:mm:ss)
  cdttmk: string;

  // 시가
  op: number;

  // 고가
  hp: number;

  // 저가
  lp: number;

  // 종가 (trade_price)
  tp: number;

  // 누적 거래량
  catv: number;

  // 누적 거래 금액
  catp: number;

  // 타임스탬프(ms)
  tms: number;

  // 스트림 타입(SNAPSHOT / REALTIME)
  st: UpbitStreamType;
}

export interface UpbitCandleDefaultRaw {
  type: UpbitCandleType; // "candle.1m" 등
  code: string;

  candle_date_time_utc: string; // yyyy-MM-dd'T'HH:mm:ss
  candle_date_time_kst: string; // yyyy-MM-dd'T'HH:mm:ss

  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;

  candle_acc_trade_volume: number;
  candle_acc_trade_price: number;

  timestamp: number; // ms
  stream_type: UpbitStreamType;
}

export type UpbitCandleRaw = UpbitCandleDefaultRaw | UpbitCandleSimpleRaw;

/**  클라이언트/도메인 용 Trade 타입
========================================
 */
export interface MarketCandle {
  code: string;

  // candle.1m 등
  type: UpbitCandleType;

  // 기준 시각
  candleDateTimeUtc: string; // yyyy-MM-dd'T'HH:mm:ss
  candleDateTimeKst: string; // yyyy-MM-dd'T'HH:mm:ss

  openingPrice: number;
  highPrice: number;
  lowPrice: number;
  tradePrice: number; // 종가

  candleAccTradeVolume: number;
  candleAccTradePrice: number;

  timestamp: number;
  streamType: UpbitStreamType;
}
