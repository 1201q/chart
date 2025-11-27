// 전일 대비 가격 변동 방향
export type UpbitChange = 'RISE' | 'EVEN' | 'FALL';

// 매수/매도 구분
export type UpbitAskBid = 'ASK' | 'BID';

// 거래 상태
export type UpbitMarketState = 'PREVIEW' | 'ACTIVE' | 'DELISTED';

// 스트림 타입
export type UpbitStreamType = 'SNAPSHOT' | 'REALTIME';

// Candle 타입
export type UpbitCandleType =
  | 'candle.1m'
  | 'candle.3m'
  | 'candle.5m'
  | 'candle.10m'
  | 'candle.15m'
  | 'candle.30m'
  | 'candle.60m'
  | 'candle.240m';

export type UpbitCandleMinutes = 1 | 3 | 5 | 10 | 15 | 30 | 60 | 240;

// url에 사용하는 캔들 타임프레임
export type UpbitCandleTimeframeUrl = 'days' | 'weeks' | 'months' | 'years';

// db에 사용하는 캔들 타임프레임
export type UpbitCandleTimeframeDb = '1d' | '1w' | '1M' | '1Y';

export const UpbitCandleTimeframeMap: Record<
  UpbitCandleTimeframeUrl,
  UpbitCandleTimeframeDb
> = {
  days: '1d',
  weeks: '1w',
  months: '1M',
  years: '1Y',
};
