'use client';

import { TradingOrderDto } from '@chart/shared-types';
import { useSyncExternalStore } from 'react';

type Listener = () => void;

class OrdersStore {
  // market, id -> order
  private byMarket = new Map<string, Map<string, TradingOrderDto>>();

  // key별로 리스너 관리 (market)
  private listenersByKey = new Map<string, Set<Listener>>();

  private cachedList = new Map<string, { dirty: boolean; snapshot: TradingOrderDto[] }>();

  private scheduledMarkets = new Set<string>();
  private scheduled = false;

  hydrateOpenOrders(openOrders: TradingOrderDto[]) {
    const nextByMarket = new Map<string, Map<string, TradingOrderDto>>();

    for (const o of openOrders) {
      let m = nextByMarket.get(o.market);
      if (!m) {
        m = new Map();
        nextByMarket.set(o.market, m);
      }

      m.set(o.id, o);
    }

    this.byMarket = nextByMarket;

    // 구독중인 market만 dirty 플래그 설정 + notify
    for (const market of this.listenersByKey.keys()) {
      this.markDirty(market);
      this.scheduleNotify(market);
    }
  }

  upsertFromStream(order: TradingOrderDto) {
    let m = this.byMarket.get(order.market);
    if (!m) {
      m = new Map();
      this.byMarket.set(order.market, m);
    }

    // status가 open이 아니면, 제거
    if (order.status !== 'OPEN') {
      if (m.delete(order.id)) {
        this.markDirty(order.market);
        this.scheduleNotify(order.market);
      }
      return;
    }

    m.set(order.id, order);
    this.markDirty(order.market);
    this.scheduleNotify(order.market);
  }

  getOpenOrders(market: string) {
    const cached = this.cachedList.get(market) ?? { dirty: true, snapshot: [] };

    if (cached.dirty) {
      const m = this.byMarket.get(market);
      const array = m ? Array.from(m.values()) : [];

      array.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));

      cached.snapshot = array;
      cached.dirty = false;
      this.cachedList.set(market, cached);
    }

    return cached.snapshot;
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

  private markDirty(market: string) {
    const cached = this.cachedList.get(market);
    if (cached) cached.dirty = true;
    else {
      this.cachedList.set(market, { dirty: true, snapshot: [] });
    }
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

export const ordersStore = new OrdersStore();

export function useOrders(market: string) {
  return useSyncExternalStore(
    (listener) => ordersStore.subscribe(market, listener),
    () => ordersStore.getOpenOrders(market),
    () => ordersStore.getOpenOrders(market),
  );
}
