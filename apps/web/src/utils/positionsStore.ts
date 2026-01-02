'use client';

import { TradingPositionDto } from '@chart/shared-types';
import { useSyncExternalStore } from 'react';

type Listener = () => void;

class PositionsStore {
  private positions = new Map<string, TradingPositionDto>();

  // key별로 리스너 관리 (market)
  private listenersByKey = new Map<string, Set<Listener>>();

  private scheduledMarkets = new Set<string>();
  private scheduled = false;

  hydrate(snapshot: TradingPositionDto[]) {
    for (const p of snapshot) {
      this.positions.set(p.market, p);
    }

    for (const p of snapshot) {
      this.scheduleNotify(p.market);
    }
  }

  upsertFromStream(position: TradingPositionDto) {
    this.positions.set(position.market, position);
    this.scheduleNotify(position.market);
  }

  get(market: string) {
    return this.positions.get(market) ?? null;
  }

  subscribe(market: string, listener: Listener) {
    let set = this.listenersByKey.get(market);
    if (!set) {
      set = new Set();
      this.listenersByKey.set(market, set);
    }

    set.add(listener);

    return () => {
      set!.delete(listener);
      if (set!.size === 0) {
        this.listenersByKey.delete(market);
      }
    };
  }

  private scheduleNotify(market: string) {
    this.scheduledMarkets.add(market);
    if (this.scheduled) return;
    this.scheduled = true;

    requestAnimationFrame(() => {
      this.scheduled = false;

      const currencies = Array.from(this.scheduledMarkets);
      this.scheduledMarkets.clear();

      for (const cy of currencies) {
        const listeners = this.listenersByKey.get(cy);
        if (!listeners) continue;
        listeners.forEach((listener) => listener());
      }
    });
  }
}

export const positionsStore = new PositionsStore();

export function useTradingPosition(market: string) {
  return useSyncExternalStore(
    (listener) => positionsStore.subscribe(market, listener),
    () => positionsStore.get(market),
    () => positionsStore.get(market),
  );
}
