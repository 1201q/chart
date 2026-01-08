'use client';

import { TradingOrderDto } from '@chart/shared-types';
import { useSyncExternalStore } from 'react';
import { StreamMeta, StreamPhase } from './streamMeta';

type Listener = () => void;

type OrdersState = { value: TradingOrderDto[]; meta: StreamMeta };

class OrdersStore {
  // market, id -> order
  private byMarket = new Map<string, Map<string, TradingOrderDto>>();

  // key별로 리스너 관리 (market)
  private listenersByKey = new Map<string, Set<Listener>>();
  private cachedList = new Map<string, { dirty: boolean; snapshot: TradingOrderDto[] }>();

  private scheduledMarkets = new Set<string>();
  private scheduled = false;

  private phase: StreamPhase = 'idle';
  private snapshoted = false;
  private error: unknown | null = null;

  private versionByMarket = new Map<string, number>();
  private cachedStateByMarket = new Map<
    string,
    { version: number; state: OrdersState }
  >();

  private bump(market: string) {
    const v = this.versionByMarket.get(market) ?? 0;
    this.versionByMarket.set(market, v + 1);
  }

  // sse 연결 시작함
  setConnecting() {
    this.phase = 'connecting';
    this.error = null;

    for (const ccy of this.listenersByKey.keys()) {
      this.scheduleNotify(ccy);
    }
  }

  setError(err: unknown) {
    this.phase = 'error';
    this.error = err;

    for (const ccy of this.listenersByKey.keys()) {
      this.scheduleNotify(ccy);
    }
  }

  hydrateOpenOrders(openOrders: TradingOrderDto[]) {
    this.snapshoted = true;
    this.phase = 'ready';
    this.error = null;

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

  getState(market: string): OrdersState {
    const version = this.versionByMarket.get(market) ?? 0;
    const cached = this.cachedStateByMarket.get(market);

    // 캐시된 같은 버전 있다면 그 value를 반환
    if (cached && cached.version === version) {
      return cached.state;
    }

    const state: OrdersState = {
      value: this.getOpenOrders(market),
      meta: {
        phase: this.phase,
        snapshoted: this.snapshoted,
        error: this.error,
      },
    };

    this.cachedStateByMarket.set(market, { version, state });
    return state;
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
    this.bump(market);

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
    () => ordersStore.getState(market),
    () => ordersStore.getState(market),
  );
}
