'use client';

import { TradingPositionDto } from '@chart/shared-types';
import { useSyncExternalStore } from 'react';
import { StreamMeta, StreamPhase } from './streamMeta';

type Listener = () => void;

type PositionState = { value: TradingPositionDto | null; meta: StreamMeta };

class PositionsStore {
  private positions = new Map<string, TradingPositionDto>();

  // key별로 리스너 관리 (market)
  private listenersByKey = new Map<string, Set<Listener>>();
  private scheduledMarkets = new Set<string>();
  private scheduled = false;

  // meta
  private phase: StreamPhase = 'idle';
  private snapshoted = false;
  private error: unknown | null = null;

  // currency 별로 cached된 상태 반환, (getsnapshot 안정화용)
  private versionByMarket = new Map<string, number>();
  private cachedStateByMarket = new Map<
    string,
    { version: number; state: PositionState }
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

  hydrate(snapshot: TradingPositionDto[]) {
    // 스냅샷 이벤트를 수신함.
    this.snapshoted = true;
    this.phase = 'ready';
    this.error = null;

    for (const p of snapshot) {
      this.positions.set(p.market, p);
      this.scheduleNotify(p.market);
    }

    for (const m of this.listenersByKey.keys()) {
      this.scheduleNotify(m);
    }
  }

  upsertFromStream(position: TradingPositionDto) {
    this.positions.set(position.market, position);
    this.scheduleNotify(position.market);
  }

  get(market: string) {
    return this.positions.get(market) ?? null;
  }

  getState(market: string): PositionState {
    const version = this.versionByMarket.get(market) ?? 0;
    const cached = this.cachedStateByMarket.get(market);

    // 캐시된 같은 버전 있다면 그 value를 반환
    if (cached && cached.version === version) {
      return cached.state;
    }

    const state: PositionState = {
      value: this.get(market),
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

  private scheduleNotify(market: string) {
    this.bump(market);

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
    () => positionsStore.getState(market),
    () => positionsStore.getState(market),
  );
}
