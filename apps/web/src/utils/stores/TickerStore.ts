import {
  MarketTickerWithNames,
  MarketTickerWithNamesMap,
  MarketTicker,
} from '@chart/shared-types';
import { ExternalStoreBase } from './_base/ExternalStoreBase';
import { KeyedExternalStoreBase } from './_base/KeyedExternalStoreBase';

type Listener = () => void;
class ListBus extends ExternalStoreBase {
  notifyListeners() {
    this.notify();
  }
}

export class TickerStore extends KeyedExternalStoreBase<string> {
  private tickers = new Map<string, MarketTickerWithNames>();

  private cachedAll: MarketTickerWithNames[] = [];
  private dirty = true;

  private cachedCodes: string[] = [];
  private codesDirty = true;

  private listBus = new ListBus();

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

  subscribeList(listener: Listener) {
    return this.listBus.subscribe(listener);
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
    this.notifyKey(ticker.code);

    this.listBus.notifyListeners();
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
