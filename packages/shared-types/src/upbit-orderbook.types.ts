import { UpbitStreamType } from './upbit-shared.types';

/** raw 타입
========================================
 */
// simple
// ========================================
export interface UpbitOrderbookUnitSimpleRaw {
  // 매도 호가
  ap: number;

  // 매수 호가
  bp: number;

  // 매도 잔량
  as: number;

  // 매수 잔량
  bs: number;
}

export interface UpbitOrderbookSimpleRaw {
  // 고정: "orderbook"
  ty: 'orderbook';

  // 페어 코드 (예: "KRW-BTC")
  cd: string;

  // 호가 매도 총 잔량
  tas: number;

  // 호가 매수 총 잔량
  tbs: number;

  // 호가 리스트
  obu: UpbitOrderbookUnitSimpleRaw[];

  // 타임스탬프(ms)
  tms: number;

  // 호가 모아보기 단위 (0: 기본 호가단위, KRW만 >0 가능)
  lv: number;

  // 스트림 타입(SNAPSHOT / REALTIME)
  st: UpbitStreamType;
}

// default
// ========================================
export interface UpbitOrderbookUnitDefaultRaw {
  ask_price: number;
  bid_price: number;
  ask_size: number;
  bid_size: number;
}

export interface UpbitOrderbookDefaultRaw {
  type: 'orderbook';
  code: string;

  total_ask_size: number;
  total_bid_size: number;

  orderbook_units: UpbitOrderbookUnitDefaultRaw[];

  timestamp: number; // ms
  level: number; // 호가 모아보기 단위

  stream_type: UpbitStreamType;
}

// 둘 다
// ========================================
export type UpbitOrderbookRaw = UpbitOrderbookDefaultRaw | UpbitOrderbookSimpleRaw;

/**  클라이언트/도메인 용 Orderbook 타입
========================================
 */
export interface MarketOrderbookUnit {
  askPrice: number;
  bidPrice: number;
  askSize: number;
  bidSize: number;
}

export interface MarketOrderbook {
  code: string;

  totalAskSize: number;
  totalBidSize: number;

  units: MarketOrderbookUnit[];

  timestamp: number;
  level: number;
  streamType: UpbitStreamType;
}

export type MarketOrderbookMap = Record<string, MarketOrderbook>;
