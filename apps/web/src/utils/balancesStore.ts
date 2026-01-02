'use client';

import { TradingBalanceDto } from '@chart/shared-types';
import { useSyncExternalStore } from 'react';

type Listener = () => void;

class BalancesStore {
  private balances = new Map<string, TradingBalanceDto>();

  // key별로 리스너 관리
  private listenersByKey = new Map<string, Set<Listener>>();

  private scheduledCurrency = new Set<string>();
  private scheduled = false;

  hydrate(snapshot: TradingBalanceDto[]) {
    for (const b of snapshot) {
      this.balances.set(b.currency, b);
    }

    for (const b of snapshot) {
      this.scheduleNotify(b.currency);
    }
  }

  updateAll(balances: TradingBalanceDto[]) {
    const next = new Map<string, TradingBalanceDto>();

    for (const b of balances) {
      next.set(b.currency, b);
    }

    this.balances = next;

    for (const ccy of this.listenersByKey.keys()) {
      this.scheduleNotify(ccy);
    }
  }

  upsertFromStream(balance: TradingBalanceDto) {
    this.balances.set(balance.currency, balance);
    this.scheduleNotify(balance.currency);
  }

  get(currency: string) {
    return this.balances.get(currency) ?? null;
  }

  subscribe(currency: string, listener: Listener) {
    let set = this.listenersByKey.get(currency);
    if (!set) {
      set = new Set();
      this.listenersByKey.set(currency, set);
    }

    set.add(listener);

    return () => {
      set!.delete(listener);
      if (set!.size === 0) {
        this.listenersByKey.delete(currency);
      }
    };
  }

  private scheduleNotify(currency: string) {
    this.scheduledCurrency.add(currency);
    if (this.scheduled) return;
    this.scheduled = true;

    requestAnimationFrame(() => {
      this.scheduled = false;

      const currencies = Array.from(this.scheduledCurrency);
      this.scheduledCurrency.clear();

      for (const cy of currencies) {
        const listeners = this.listenersByKey.get(cy);
        if (!listeners) continue;
        listeners.forEach((listener) => listener());
      }
    });
  }
}

export const balancesStore = new BalancesStore();

export function useTradingBalance(currency: string) {
  return useSyncExternalStore(
    (listener) => balancesStore.subscribe(currency, listener),
    () => balancesStore.get(currency),
    () => balancesStore.get(currency),
  );
}
