'use client';

import { TradingBalanceDto } from '@chart/shared-types';
import { useSyncExternalStore } from 'react';
import { StreamMeta, StreamPhase } from './streamMeta';

type Listener = () => void;

type BalanceState = { value: TradingBalanceDto | null; meta: StreamMeta };

class BalancesStore {
  private balances = new Map<string, TradingBalanceDto>();

  private listenersByKey = new Map<string, Set<Listener>>(); // key별로 리스너 관리
  private scheduledCurrency = new Set<string>();
  private scheduled = false;

  // meta
  private phase: StreamPhase = 'idle';
  private snapshoted = false;
  private error: unknown | null = null;

  // currency 별로 cached된 상태 반환, (getsnapshot 안정화용)
  private versionByCurrency = new Map<string, number>();
  private cachedStateByCurrency = new Map<
    string,
    { version: number; state: BalanceState }
  >();

  private bump(currency: string) {
    const v = this.versionByCurrency.get(currency) ?? 0;
    this.versionByCurrency.set(currency, v + 1);
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

  hydrate(snapshot: TradingBalanceDto[]) {
    // 스냅샷 이벤트를 수신함.
    this.snapshoted = true;
    this.phase = 'ready';
    this.error = null;

    for (const b of snapshot) {
      this.balances.set(b.currency, b);
    }

    for (const b of snapshot) {
      this.scheduleNotify(b.currency);
    }

    // if: 스냅샷에 krw가 없을 경우가 존재할 수 있으므로 (무한 스켈레톤 방지)
    // 구독 중인 모든 리스너에 대해 notify 처리
    for (const ccy of this.listenersByKey.keys()) {
      this.scheduleNotify(ccy);
    }
  }

  upsertFromStream(changed: TradingBalanceDto[]) {
    for (const c of changed) {
      this.balances.set(c.currency, c);
      this.scheduleNotify(c.currency);
    }
  }

  get(currency: string) {
    return this.balances.get(currency) ?? null;
  }

  getState(currency: string): BalanceState {
    const version = this.versionByCurrency.get(currency) ?? 0;
    const cached = this.cachedStateByCurrency.get(currency);

    // 캐시된 같은 버전 있다면 그 value를 반환
    if (cached && cached.version === version) {
      return cached.state;
    }

    const state: BalanceState = {
      value: this.get(currency),
      meta: {
        phase: this.phase,
        snapshoted: this.snapshoted,
        error: this.error,
      },
    };

    this.cachedStateByCurrency.set(currency, { version, state });
    return state;
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
    // 상태가 바뀜 (버전 증가, getState 캐시 무효화)
    this.bump(currency);

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
    () => balancesStore.getState(currency),
    () => balancesStore.getState(currency),
  );
}
