import {
  MarketTickerWithNames,
  MarketTickerWithNamesMap,
  MarketTicker,
} from '@chart/shared-types';
import { ExternalStoreBase } from './_base/ExternalStoreBase';

export class TickerStore extends ExternalStoreBase {
  private tickers = new Map<string, MarketTickerWithNames>();

  private cachedAll: MarketTickerWithNames[] = [];
  private dirty = true;

  private cachedCodes: string[] = [];
  private codesDirty = true;

  constructor(initialSnapshot: MarketTickerWithNamesMap) {
    super();
    this.hydrate(initialSnapshot);
  }

  private hydrate(initialSnapshot: MarketTickerWithNamesMap) {
    for (const [code, ticker] of Object.entries(initialSnapshot)) {
      this.tickers.set(code, ticker);
    }

    this.dirty = true;
    this.codesDirty = true;
  }

  upsertFromStream(ticker: MarketTicker) {
    const prev = this.tickers.get(ticker.code);
    if (!prev) return;

    // 이름 머지
    const merged: MarketTickerWithNames = {
      ...prev, // korean_name, english_name 유지
      ...ticker, // 그 외 새로운 데이터로 덮어쓰기
    };

    this.tickers.set(ticker.code, merged);

    this.dirty = true; // 캐시 다시 계산
    this.codesDirty = true;
    this.notify();
  }

  getTicker(code: string) {
    return this.tickers.get(code);
  }

  getAllSorted() {
    if (this.dirty) {
      this.cachedAll = Array.from(this.tickers.values()).sort(
        (a, b) => b.accTradePrice24h - a.accTradePrice24h,
      );
      this.dirty = false;
    }
    return this.cachedAll;
  }

  getSortedCodes(): string[] {
    if (this.codesDirty) {
      const codes = this.getAllSorted().map((t) => t.code);

      const prev = this.cachedCodes;
      const isChanged =
        codes.length !== prev.length || codes.some((code, i) => code !== prev[i]);

      if (isChanged) this.cachedCodes = codes;
      this.codesDirty = false;
    }

    return this.cachedCodes;
  }
}
