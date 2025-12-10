'use client';

import { MarketTradeWithId } from '@chart/shared-types';

type Listener = () => void;

class TradeStore {
  private trades: MarketTradeWithId[] = [];
  private listeners = new Set<Listener>();
  private scheduled = false;
  private readonly MAX_TRADES = 50;

  private currentCode: string | null = null;

  private ids = new Set<string>();

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

  getTrades(): MarketTradeWithId[] {
    return this.trades;
  }

  // code 바뀔때
  resetForCode(code: string) {
    if (this.currentCode === code) return;

    this.currentCode = code;
    this.trades = [];
    this.ids.clear();
    this.scheduleNotify();
  }

  hydrate(code: string, snapshot: MarketTradeWithId[]) {
    this.resetForCode(code);

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

    this.scheduleNotify();
  }
}

export const tradeStore = new TradeStore();
