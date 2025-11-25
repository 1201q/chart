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

  // 초기 스냅샷으로 상태 설정
  hydrate(initialSnapshot: MarketTickerWithNamesMap) {
    if (this.hydrated) return;

    Object.entries(initialSnapshot).forEach(([code, ticker]) => {
      this.tickers.set(code, ticker);
    });
    this.hydrated = true;
    this.dirty = true; // 캐시 다시 계산
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
