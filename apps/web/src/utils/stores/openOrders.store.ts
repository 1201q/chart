'use client';

import { TradingOrderDto } from '@chart/shared-types';
import { useSyncExternalStore } from 'react';
import { StreamMeta, StreamPhase } from './streamMeta';

type Listener = () => void;

type OrdersState = { value: TradingOrderDto[]; meta: StreamMeta };

class OpenOrdersStore {
  // market, id -> order
  private byMarket = new Map<string, Map<string, TradingOrderDto>>();

  // key별로 리스너 관리 (market)
  private listenersByKey = new Map<string, Set<Listener>>();
  private cachedList = new Map<string, { dirty: boolean; snapshot: TradingOrderDto[] }>();

  private listenersAll = new Set<Listener>();

  private scheduledMarkets = new Set<string>();
  private scheduled = false;
  private scheduledAll = false;

  private phase: StreamPhase = 'idle';
  private snapshoted = false;
  private error: unknown | null = null;

  private versionByMarket = new Map<string, number>();
  private cachedStateByMarket = new Map<
    string,
    { version: number; state: OrdersState }
  >();

  // 전체 버전
  private versionAll = 0;
  private cachedAllState: { version: number; state: OrdersState } | null = null;
  private cachedAllList: { dirty: boolean; snapshot: TradingOrderDto[] } = {
    dirty: true,
    snapshot: [],
  };

  private bump(market: string) {
    const v = this.versionByMarket.get(market) ?? 0;
    this.versionByMarket.set(market, v + 1);
  }

  private bumpAll() {
    this.versionAll += 1;
  }

  // sse 연결 시작함
  setConnecting() {
    this.phase = 'connecting';
    this.error = null;

    for (const ccy of this.listenersByKey.keys()) {
      this.scheduleNotify(ccy, false);
    }

    this.scheduleNotifyAll();
  }

  setError(err: unknown) {
    this.phase = 'error';
    this.error = err;

    for (const ccy of this.listenersByKey.keys()) {
      this.scheduleNotify(ccy, false);
    }

    this.scheduleNotifyAll();
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

    this.markAllDirty();

    // 구독중인 market만 dirty 플래그 설정 + notify
    for (const market of this.listenersByKey.keys()) {
      this.markDirty(market);
      this.scheduleNotify(market, false);
    }

    this.scheduleNotifyAll();
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
        this.markAllDirty();

        this.scheduleNotify(order.market, false);
        this.scheduleNotifyAll();
      }
      return;
    }

    m.set(order.id, order);
    this.markDirty(order.market);
    this.markAllDirty();

    this.scheduleNotify(order.market, false);
    this.scheduleNotifyAll();
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

  getAllOpenOrders() {
    if (this.cachedAllList.dirty) {
      const all: TradingOrderDto[] = [];
      for (const m of this.byMarket.values()) {
        all.push(...m.values());
      }

      all.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));

      this.cachedAllList.snapshot = all;
      this.cachedAllList.dirty = false;
    }

    return this.cachedAllList.snapshot;
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

  getAllState(): OrdersState {
    if (this.cachedAllState && this.cachedAllState.version === this.versionAll) {
      return this.cachedAllState.state;
    }

    const state: OrdersState = {
      value: this.getAllOpenOrders(),
      meta: {
        phase: this.phase,
        snapshoted: this.snapshoted,
        error: this.error,
      },
    };

    this.cachedAllState = { version: this.versionAll, state };
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

  subscribeAll(listener: Listener) {
    this.listenersAll.add(listener);
    return () => {
      this.listenersAll.delete(listener);
    };
  }

  // mark dirty
  private markDirty(market: string) {
    const cached = this.cachedList.get(market);
    if (cached) cached.dirty = true;
    else {
      this.cachedList.set(market, { dirty: true, snapshot: [] });
    }
  }

  private markAllDirty() {
    this.cachedAllList.dirty = true;
  }

  // all의 경우는 선택, all 구독도 notify 할지?
  private scheduleNotify(market: string, notifyAll = false) {
    this.bump(market);
    this.scheduledMarkets.add(market);

    if (notifyAll) this.scheduleNotifyAll();

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

      if (this.scheduledAll) {
        this.scheduledAll = false;
        this.listenersAll.forEach((listener) => listener());
      }
    });
  }

  private scheduleNotifyAll() {
    this.bumpAll();
    this.scheduledAll = true;

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

      if (this.scheduledAll) {
        this.scheduledAll = false;
        this.listenersAll.forEach((listener) => listener());
      }
    });
  }
}

export const openOrdersStore = new OpenOrdersStore();

export function useOpenOrders(market: string) {
  return useSyncExternalStore(
    (listener) => openOrdersStore.subscribe(market, listener),
    () => openOrdersStore.getState(market),
    () => openOrdersStore.getState(market),
  );
}

export function useAllOpenOrders() {
  return useSyncExternalStore(
    (listener) => openOrdersStore.subscribeAll(listener),
    () => openOrdersStore.getAllState(),
    () => openOrdersStore.getAllState(),
  );
}
