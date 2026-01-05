'use client';

import { TradingFillDto } from '@chart/shared-types';
import { useSyncExternalStore } from 'react';

type Listener = () => void;

class FillsStore {
  // market -> recent fills
  private byMarket = new Map<string, TradingFillDto[]>();

  private idsByMarket = new Map<string, Set<string>>();

  // key별로 리스너 관리 (market)
  private listenersByKey = new Map<string, Set<Listener>>();

  private readonly MAX = 200;

  private scheduledMarkets = new Set<string>();
  private scheduled = false;

  hydrateRecentFills(recentFills: TradingFillDto[]) {
    // snapshot에서 다시 맵 구성
    const next = new Map<string, TradingFillDto[]>();
    const nextIds = new Map<string, Set<string>>();

    const sorted = recentFills
      .slice()
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

    for (const f of sorted) {
      let list = next.get(f.market);
      let ids = nextIds.get(f.market);

      if (!list) {
        list = [];
        next.set(f.market, list);
      }

      if (!ids) {
        ids = new Set<string>();
        nextIds.set(f.market, ids);
      }

      if (ids.has(f.id)) continue;
      ids.add(f.id);
      list.push(f);

      if (list.length >= this.MAX) {
        continue;
      }
    }

    this.byMarket = next;
    this.idsByMarket = nextIds;

    // 구독중인 market만 dirty 플래그 설정 + notify
    for (const market of this.listenersByKey.keys()) {
      this.scheduleNotify(market);
    }
  }

  append(fill: TradingFillDto) {
    const market = fill.market;

    let ids = this.idsByMarket.get(market);
    if (!ids) {
      ids = new Set<string>();
      this.idsByMarket.set(market, ids);
    }
    if (ids.has(fill.id)) return;

    let list = this.byMarket.get(market);
    if (!list) {
      list = [];
      this.byMarket.set(market, list);
    }

    ids.add(fill.id);

    const merged = [fill, ...list].sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
    );

    const trimmed = merged.slice(0, this.MAX);
    this.byMarket.set(market, trimmed);

    const nextIds = new Set<string>();
    for (const f of trimmed) nextIds.add(f.id);
    this.idsByMarket.set(market, nextIds);

    // 구독중인 market만 notify
    this.scheduleNotify(market);
  }

  getRecent(market: string) {
    return this.byMarket.get(market) ?? [];
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

      const market = Array.from(this.scheduledMarkets);
      this.scheduledMarkets.clear();

      for (const m of market) {
        const listeners = this.listenersByKey.get(m);
        if (!listeners) continue;
        listeners.forEach((listener) => listener());
      }
    });
  }
}

export const fillsStore = new FillsStore();

export function useRecentFills(market: string) {
  return useSyncExternalStore(
    (listener) => fillsStore.subscribe(market, listener),
    () => fillsStore.getRecent(market),
    () => fillsStore.getRecent(market),
  );
}
