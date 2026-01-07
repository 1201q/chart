'use client';

import { MarketTradeWithId } from '@chart/shared-types';
import { useSyncExternalStore } from 'react';
import { StreamMeta, StreamPhase } from './streamMeta';

type Listener = () => void;
type TradeMeta = Readonly<StreamMeta>;

class TradeStore {
  private trades: MarketTradeWithId[] = [];
  private listeners = new Set<Listener>();
  private scheduled = false;
  private readonly MAX_TRADES = 50;

  private currentCode: string | null = null;
  private ids = new Set<string>();

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

  // 항상 같은 객체를 반환하도록
  getMeta(): TradeMeta {
    this.cachedMeta.phase = this.phase;
    this.cachedMeta.snapshoted = this.snapshoted;
    this.cachedMeta.error = this.error;
    return this.cachedMeta;
  }

  getTrades(): MarketTradeWithId[] {
    return this.trades;
  }

  // code 바뀔때
  resetForCode(code: string) {
    if (this.currentCode === code) return;

    this.currentCode = code;
    this.trades = [];
    this.ids.clear();

    this.snapshoted = false;
    this.phase = 'connecting';
    this.error = null;

    this.scheduleNotify();
  }

  hydrate(code: string, snapshot: MarketTradeWithId[]) {
    this.resetForCode(code);

    this.snapshoted = true;
    this.phase = 'ready';
    this.error = null;

    const next: MarketTradeWithId[] = [];
    const ids = new Set<string>();

    const sorted = snapshot.slice().sort((a, b) => b.tradeTimestamp - a.tradeTimestamp);

    for (const trade of sorted) {
      const id = String(trade.id);

      if (ids.has(id)) continue; // 스킵

      ids.add(id);
      next.push(trade);

      if (next.length >= this.MAX_TRADES) break;
    }

    this.trades = next;
    this.ids = ids;
    this.scheduleNotify();
  }

  // 이미 있는 id면 교체하고, 아니면 추가, 50개까지만
  pushTrades(code: string, newTrade: MarketTradeWithId) {
    if (this.currentCode !== code) return;

    const id = String(newTrade.id);

    // 이미 있는 id라면 => 해당 요소를 교체만 하고 끝
    if (this.ids.has(id)) {
      const idx = this.trades.findIndex((t) => String(t.id) === id);

      if (idx !== -1) {
        const copy = this.trades.slice();
        copy[idx] = newTrade;
        this.trades = copy;
        this.phase = 'ready';

        this.scheduleNotify();
      }
      return;
    }

    // 새로운 id라면 => 앞에 붙이고 오래된 것 잘라냄
    const merged = [newTrade, ...this.trades].sort(
      (a, b) => b.tradeTimestamp - a.tradeTimestamp,
    );

    // MAX_TRADES 넘으면 잘라내면서 id 세트도 정리
    if (merged.length > this.MAX_TRADES) {
      const trimmed = merged.slice(0, this.MAX_TRADES);
      const ids = new Set<string>();
      for (const t of trimmed) {
        ids.add(String(t.id));
      }
      this.trades = trimmed;
      this.ids = ids;
    } else {
      this.trades = merged;
      this.ids.add(id);
    }

    this.phase = 'ready';
    this.scheduleNotify();
  }
}

export const tradeStore = new TradeStore();

export function useTrades(): MarketTradeWithId[] {
  return useSyncExternalStore(
    (listener) => tradeStore.subscribe(listener),
    () => tradeStore.getTrades(),
    () => tradeStore.getTrades(),
  );
}

export function useTradeMeta(): TradeMeta {
  return useSyncExternalStore(
    (listener) => tradeStore.subscribe(listener),
    () => tradeStore.getMeta(),
    () => tradeStore.getMeta(),
  );
}
