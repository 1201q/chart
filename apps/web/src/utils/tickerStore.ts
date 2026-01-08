'use client';

import {
  MarketTickerWithNames,
  MarketTickerWithNamesMap,
  MarketTicker,
} from '@chart/shared-types';
import { useSyncExternalStore } from 'react';
import { StreamMeta, StreamPhase } from './streamMeta';

type Listener = () => void;
type TickerMeta = Readonly<StreamMeta>;

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

  // meta
  private phase: StreamPhase = 'idle';
  private snapshoted = false;
  private error: unknown | null = null;

  private cachedMeta: { phase: StreamPhase; snapshoted: boolean; error: unknown | null } =
    {
      phase: 'idle',
      snapshoted: false,
      error: null,
    };

  // sse 연결 시작함
  setConnecting() {
    this.phase = 'connecting';
    this.error = null;

    this.scheduleNotify();
  }

  setError(err: unknown) {
    this.phase = 'error';
    this.error = err;
    this.scheduleNotify();
  }

  // 초기 스냅샷으로 상태 설정
  hydrate(initialSnapshot: MarketTickerWithNamesMap) {
    if (this.hydrated) return;

    Object.entries(initialSnapshot).forEach(([code, ticker]) => {
      this.tickers.set(code, ticker);
    });

    this.hydrated = true;

    //  meta 확정
    this.snapshoted = true;
    this.phase = 'ready';
    this.error = null;

    this.dirty = true; // 캐시 다시 계산
    this.codesDirty = true;

    this.scheduleNotify();
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

    if (this.phase !== 'error') this.phase = 'ready';

    this.scheduleNotify();
  }

  // 항상 같은 객체를 반환하도록
  getMeta(): TickerMeta {
    this.cachedMeta.phase = this.phase;
    this.cachedMeta.snapshoted = this.snapshoted;
    this.cachedMeta.error = this.error;
    return this.cachedMeta;
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

export function useTicker(code: string): MarketTickerWithNames | undefined {
  return useSyncExternalStore(
    (listener) => tickerStore.subscribe(listener),
    () => tickerStore.getTicker(code),
    () => tickerStore.getTicker(code),
  );
}

export const useTickerCodes = (): string[] => {
  return useSyncExternalStore(
    (listener) => tickerStore.subscribe(listener),
    () => tickerStore.getSortedCodes(),
    () => tickerStore.getSortedCodes(),
  );
};

export const useTickerMeta = (): TickerMeta => {
  return useSyncExternalStore(
    (listener) => tickerStore.subscribe(listener),
    () => tickerStore.getMeta(),
    () => tickerStore.getMeta(),
  );
};
