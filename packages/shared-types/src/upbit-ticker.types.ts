import {
  UpbitAskBid,
  UpbitChange,
  UpbitMarketState,
  UpbitStreamType,
} from './upbit-shared.types';

/** raw 타입
========================================
 */

export interface UpbitTickerSimpleRaw {
  // 고정: ticker
  ty: 'ticker';

  // 페어 코드 (예: "KRW-BTC")
  cd: string;

  // 시가
  op: number;

  // 고가
  hp: number;

  // 저가
  lp: number;

  // 현재가
  tp: number;

  // 전일 종가
  pcp: number;

  // 전일 대비 가격 변동 방향
  c: UpbitChange;

  // 전일 대비 가격 변동 절대값
  cp: number;

  // 전일 대비 가격 변동 값 (부호 포함)
  scp: number;

  // 전일 대비 등락율 절대값
  cr: number;

  // 전일 대비 등락율 (부호 포함)
  scr: number;

  // 가장 최근 거래량
  tv: number;

  // 누적 거래량 (UTC 0시 기준)
  atv: number;

  // 24시간 누적 거래량
  atv24h: number;

  // 누적 거래대금 (UTC 0시 기준)
  atp: number;

  // 24시간 누적 거래대금
  atp24h: number;

  // 최근 거래 일자 (UTC, yyyyMMdd)
  tdt: string;

  // 최근 거래 시각 (UTC, HHmmss)
  ttm: string;

  // 체결 타임스탬프(ms)
  ttms: number;

  // 매수/매도 구분
  ab: UpbitAskBid;

  // 누적 매도량
  aav: number;

  // 누적 매수량
  abv: number;

  // 52주 최고가
  h52wp: number;

  // 52주 최고가 달성일 (yyyy-MM-dd)
  h52wdt: string;

  // 52주 최저가
  l52wp: number;

  // 52주 최저가 달성일 (yyyy-MM-dd)
  l52wdt: string;

  // 거래 상태
  ms: UpbitMarketState;

  // 거래 정지 여부 (Deprecated)
  its: boolean;

  // 거래지원 종료일 (yyyy-MM-dd 또는 null)
  dd: string | null;

  // 유의 종목 여부 (Deprecated)
  // 문서상 NONE / CAUTION 이라서 그대로 둠
  mw: string;

  // 서버 타임스탬프(ms)
  tms: number;

  // 스트림 타입 (SNAPSHOT / REALTIME)
  st: UpbitStreamType;
}

export interface UpbitTickerDefaultRaw {
  // 고정: "ticker"
  type: 'ticker';

  // 페어 코드 (예: "KRW-BTC")
  code: string;

  // 시가
  opening_price: number;

  // 고가
  high_price: number;

  // 저가
  low_price: number;

  // 현재가
  trade_price: number;

  // 전일 종가
  prev_closing_price: number;

  // 전일 종가 대비 가격 변동 방향
  change: UpbitChange;

  // 전일 대비 가격 변동 절대값
  change_price: number;

  // 전일 대비 가격 변동 값 (부호 포함)
  signed_change_price: number;

  // 전일 대비 등락율 절대값
  change_rate: number;

  // 전일 대비 등락율 (부호 포함)
  signed_change_rate: number;

  // 가장 최근 거래량
  trade_volume: number;

  // 누적 거래량 (UTC 0시 기준)
  acc_trade_volume: number;

  // 24시간 누적 거래량
  acc_trade_volume_24h: number;

  // 누적 거래대금 (UTC 0시 기준)
  acc_trade_price: number;

  // 24시간 누적 거래대금
  acc_trade_price_24h: number;

  // 최근 거래 일자 (UTC, yyyyMMdd)
  trade_date: string;

  // 최근 거래 시각 (UTC, HHmmss)
  trade_time: string;

  // 체결 타임스탬프(ms)
  trade_timestamp: number;

  // 매수/매도 구분
  ask_bid: UpbitAskBid;

  // 누적 매도량
  acc_ask_volume: number;

  // 누적 매수량
  acc_bid_volume: number;

  // 52주 최고가
  highest_52_week_price: number;

  // 52주 최고가 달성일 (yyyy-MM-dd)
  highest_52_week_date: string;

  // 52주 최저가
  lowest_52_week_price: number;

  // 52주 최저가 달성일 (yyyy-MM-dd)
  lowest_52_week_date: string;

  // 거래 상태
  market_state: UpbitMarketState;

  // 거래 정지 여부 (Deprecated)
  is_trading_suspended: boolean;

  // 거래지원 종료일 (yyyy-MM-dd 또는 null)
  delisting_date: string | null;

  // 유의 종목 여부 (Deprecated: NONE / CAUTION 등)
  market_warning: string;

  // 서버 타임스탬프(ms)
  timestamp: number;

  // 스트림 타입(SNAPSHOT / REALTIME)
  stream_type: UpbitStreamType;
}

export type UpbitTickerRaw = UpbitTickerDefaultRaw | UpbitTickerSimpleRaw;

/**  클라이언트/도메인 용 Ticker 타입
========================================
 */

export interface MarketTicker {
  // 예: "KRW-BTC"
  code: string;

  openingPrice: number;
  highPrice: number;
  lowPrice: number;
  tradePrice: number;
  prevClosingPrice: number;

  // 전일 대비 방향 / 가격 / 비율
  change: UpbitChange;
  changePrice: number;
  signedChangePrice: number;
  changeRate: number;
  signedChangeRate: number;

  // 거래량 / 거래대금
  tradeVolume: number;
  accTradeVolume: number;
  accTradeVolume24h: number;
  accTradePrice: number;
  accTradePrice24h: number;

  // 최근 거래 시각 (UTC 기준)
  tradeDateUtc: string; // yyyyMMdd
  tradeTimeUtc: string; // HHmmss
  tradeTimestamp: number; // ms

  askBid: UpbitAskBid;
  accAskVolume: number;
  accBidVolume: number;

  // 52주 고저
  highest52WeekPrice: number;
  highest52WeekDate: string; // yyyy-MM-dd
  lowest52WeekPrice: number;
  lowest52WeekDate: string; // yyyy-MM-dd

  marketState: UpbitMarketState;

  // Deprecated 필드
  isTradingSuspended?: boolean;
  delistingDate?: string | null;
  marketWarning?: string;

  // 서버 타임스탬프
  timestamp: number;
  streamType: UpbitStreamType;
}

export interface MarketTickerWithNames extends MarketTicker {
  koreanName: string;
  englishName: string;
}

export type MarketTickerMap = Record<string, MarketTicker>;
export type MarketTickerWithNamesMap = Record<string, MarketTickerWithNames>;
