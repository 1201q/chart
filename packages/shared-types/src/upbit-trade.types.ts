import { UpbitAskBid, UpbitChange, UpbitStreamType } from './upbit-shared.types';

/** raw 타입
========================================
 */
export interface UpbitTradeSimpleRaw {
  // 고정: "trade"
  ty: 'trade';

  // 페어 코드 (예: "KRW-BTC")
  cd: string;

  // 체결 가격
  tp: number;

  // 체결량
  tv: number;

  // 매수/매도 구분
  ab: UpbitAskBid;

  // 전일 종가
  pcp: number;

  // 전일 종가 대비 가격 변동 방향
  c: UpbitChange;

  // 전일 대비 가격 변동의 절대값
  cp: number;

  // 체결 일자 (UTC, yyyy-MM-dd)
  td: string;

  // 체결 시각 (UTC, HH:mm:ss)
  ttm: string;

  // 체결 타임스탬프(ms)
  ttms: number;

  // 서버 타임스탬프(ms)
  tms: number;

  // 체결 번호(Unique)
  sid: number;

  // 최우선 매도 호가
  bap: number;

  // 최우선 매도 잔량
  bas: number;

  // 최우선 매수 호가
  bbp: number;

  // 최우선 매수 잔량
  bbs: number;

  // 스트림 타입(SNAPSHOT / REALTIME)
  st: UpbitStreamType;
}

export interface UpbitTradeDefaultRaw {
  type: 'trade';
  code: string;

  trade_price: number;
  trade_volume: number;
  ask_bid: UpbitAskBid;

  prev_closing_price: number;
  change: UpbitChange;
  change_price: number;

  trade_date: string; // yyyy-MM-dd
  trade_time: string; // HH:mm:ss
  trade_timestamp: number; // ms

  timestamp: number; // ms
  sequential_id: number;

  best_ask_price: number;
  best_ask_size: number;
  best_bid_price: number;
  best_bid_size: number;

  stream_type: UpbitStreamType;
}

export type UpbitTradeRaw = UpbitTradeDefaultRaw | UpbitTradeSimpleRaw;

/**  클라이언트/도메인 용 Trade 타입
========================================
 */
export interface MarketTrade {
  // 예: "KRW-BTC"
  code: string;

  tradePrice: number;
  tradeVolume: number;
  askBid: UpbitAskBid;

  prevClosingPrice: number;
  change: UpbitChange;
  changePrice: number;

  tradeDateUtc: string; // yyyy-MM-dd
  tradeTimeUtc: string; // HH:mm:ss
  tradeTimestamp: number; // ms

  timestamp: number; // 서버 타임스탬프(ms)
  sequentialId: number;

  bestAskPrice: number;
  bestAskSize: number;
  bestBidPrice: number;
  bestBidSize: number;

  streamType: UpbitStreamType;
}

export type MarketTradeWithId = MarketTrade & { id: string };



export type MarketTradeMap = Record<string, MarketTrade>;
