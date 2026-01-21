'use client';

import { TickerStoreContext } from '@/utils/context/store.context';
import { MarketTickerWithNames } from '@chart/shared-types';
import { useContext, useSyncExternalStore } from 'react';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';

// 1. 코인 하나의 티커 구독
// ================================
export function useTicker(code: string): MarketTickerWithNames | undefined {
  const store = useTickerStore();

  return useSyncExternalStore(
    (listener) => store.subscribeKey(code, listener),
    () => store.getTicker(code),
    () => store.getTicker(code),
  );
}

// 코인 하나 중 필요한 값만 구독
export function useTickerSelector<T>(
  code: string,
  selector: (ticker: MarketTickerWithNames | undefined) => T,
  isEqual: (a: T, b: T) => boolean = Object.is,
): T {
  const store = useTickerStore();

  return useSyncExternalStoreWithSelector(
    (listener) => store.subscribeKey(code, listener),
    () => store.getTicker(code),
    () => store.getTicker(code),
    selector,
    isEqual,
  );
}

export function useTickerSelector2<T>(
  code: string,
  selector: (s: MarketTickerWithNames | undefined) => T,
) {
  const store = useTickerStore();

  const getClientSnapshot = () => selector(store.getTicker(code));
  const getServerSnapshot = () => selector(store.getTicker(code));

  return useSyncExternalStore(
    (listener) => store.subscribeKey(code, listener),
    getClientSnapshot,
    getServerSnapshot,
  );
}

// 2. 정렬된 리스트 코드 리스트 반환
// ================================
export function useSortedTickerCodes(): string[] {
  const store = useTickerStore();

  return useSyncExternalStore(
    (listener) => store.subscribeList(listener),
    () => store.getSortedCodes(),
    () => store.getSortedCodes(),
  );
}

// 3. 리스트가 전체 ticker 객체가 필요할때
export function useAllSortedTickers(): MarketTickerWithNames[] {
  const store = useTickerStore();

  return useSyncExternalStore(
    (listener) => store.subscribeList(listener),
    () => store.getAllSorted(),
    () => store.getAllSorted(),
  );
}

export function useTickerStore() {
  const store = useContext(TickerStoreContext);
  if (!store) throw new Error('TickerProvider is missing');
  return store;
}
