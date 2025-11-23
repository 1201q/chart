export type MarketCode = string;

/**
 * 업비트 마켓 정보 (GET /v1/market/all)
 */
export type MarketInfoRes = {
  market: MarketCode;
  korean_name: string;
  english_name: string;
};

/**
 * 내부에서 사용할 마켓 타입
 */
export type MarketInfo = {
  code: MarketCode; // "KRW-BTC"
  koreanName: string;
  englishName: string;
  baseCurrency: string; // "BTC"
  quoteCurrency: string; // "KRW"
};

export type MarketDiff = {
  added: MarketInfo[];
  removed: MarketInfo[];
};
