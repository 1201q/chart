'use client';

import {
  MarketTickerWithNames,
  MarketTickerWithNamesMap,
  MarketTicker,
} from '@chart/shared-types';

type Listener = () => void;

class TickerStore {
  private tickers = new Map<string, MarketTickerWithNames>();
  private listeners = new Set<Listener>();
  private scheduled = false;
  private hydrated = false;

  // 스냅샷 캐시
  private cachedAll: MarketTickerWithNames[] = [];
  private dirty = true;

  // only code 캐시 (리스트 렌더용)
  private cachedCodes: string[] = [];
  private codesDirty = true;

  // 초기 스냅샷으로 상태 설정
  hydrate(initialSnapshot: MarketTickerWithNamesMap) {
    if (this.hydrated) return;

    Object.entries(initialSnapshot).forEach(([code, ticker]) => {
      this.tickers.set(code, ticker);
    });
    this.hydrated = true;
    this.dirty = true; // 캐시 다시 계산
    this.codesDirty = true;
  }

  upsertFromStream(ticker: MarketTicker) {
    const code = ticker.code;
    const prev = this.tickers.get(code);

    if (!prev) return;

    // 이름 머지
    const merged: MarketTickerWithNames = {
      ...prev, // korean_name, english_name 유지
      ...ticker, // 그 외 새로운 데이터로 덮어쓰기
    };

    this.tickers.set(code, merged);
    this.dirty = true; // 캐시 다시 계산
    this.codesDirty = true;
    this.scheduleNotify();
  }

  getAll(): MarketTickerWithNames[] {
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
      const sorted = this.getAll();
      const codes = sorted.map((ticker) => ticker.code);

      const prev = this.cachedCodes;
      const isChanged =
        codes.length !== prev.length || codes.some((code, i) => code !== prev[i]);

      if (isChanged) {
        this.cachedCodes = codes;
      }

      this.codesDirty = false;
    }

    return this.cachedCodes;
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private scheduleNotify() {
    if (this.scheduled) return;
    this.scheduled = true;

    requestAnimationFrame(() => {
      this.scheduled = false;
      this.listeners.forEach((listener) => listener());
    });
  }

  getCodes(): string[] {
    return Array.from(this.tickers.keys());
  }

  getTicker(code: string): MarketTickerWithNames | undefined {
    return this.tickers.get(code);
  }
}

export const tickerStore = new TickerStore();
