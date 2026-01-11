'use client';

import { useTickerStream } from '@/hooks/useTickerStream';
import { TickerStore } from '@/utils/stores/TickerStore';

import { MarketTickerWithNames, MarketTickerWithNamesMap } from '@chart/shared-types';
import { createContext, useContext, useState } from 'react';
import { useSyncExternalStore } from 'react';

const TickerStoreContext = createContext<TickerStore | null>(null);

export function NewTickerProvider({
  initialSnapshot,
  children,
}: {
  initialSnapshot: MarketTickerWithNamesMap;
  children: React.ReactNode;
}) {
  const [store] = useState(() => new TickerStore(initialSnapshot));

  useTickerStream(store);

  return (
    <TickerStoreContext.Provider value={store}>{children}</TickerStoreContext.Provider>
  );
}

export function useTickerStore() {
  const store = useContext(TickerStoreContext);
  if (!store) throw new Error('TickerProvider is missing');
  return store;
}

export function useTicker(code: string): MarketTickerWithNames | undefined {
  const store = useTickerStore();

  return useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getTicker(code),
    () => store.getTicker(code),
  );
}

export function useTickerCodes(): string[] {
  const store = useTickerStore();

  return useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getSortedCodes(),
    () => store.getSortedCodes(),
  );
}
