'use client';

import { MarketTrade } from '@chart/shared-types';

type Listener = () => void;

class TradeStore {
  private trades: MarketTrade[] = [];
  private listeners = new Set<Listener>();
  private scheduled = false;
  private readonly MAX_TRADES = 50;

  private currentCode: string | null = null;

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

  getTrades(): MarketTrade[] {
    return this.trades;
  }

  // code 바뀔때
  resetForCode(code: string) {
    if (this.currentCode === code) return;

    this.currentCode = code;
    this.trades = [];
    this.scheduleNotify();
  }

  hydrate(code: string, snapshot: MarketTrade[]) {
    this.resetForCode(code);

    const next = snapshot
      .slice()
      .sort((a, b) => b.tradeTimestamp - a.tradeTimestamp)
      .slice(0, this.MAX_TRADES);

    this.trades = next;
    this.scheduleNotify();
  }

  pushTrades(code: string, newTrade: MarketTrade) {
    if (this.currentCode !== code) return;

    const merged = [newTrade, ...this.trades]
      .sort((a, b) => b.tradeTimestamp - a.tradeTimestamp)
      .slice(0, this.MAX_TRADES);

    this.trades = merged;
    this.scheduleNotify();
  }
}

export const tradeStore = new TradeStore();
