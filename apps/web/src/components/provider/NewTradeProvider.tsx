'use client';

import { useTradeStream } from '@/hooks/useTradeStream';
import { TradeStore } from '@/utils/stores/TradeStore';
import { MarketTradeWithId } from '@chart/shared-types';
import { createContext, useContext, useState } from 'react';
import { useSyncExternalStore } from 'react';

const TradeStoreContext = createContext<TradeStore | null>(null);

export function NewTradeProvider({
  code,
  initialSnapshot,
  children,
}: {
  code: string;
  initialSnapshot: MarketTradeWithId[];
  children: React.ReactNode;
}) {
  const [store] = useState(() => new TradeStore(initialSnapshot, 50));

  useTradeStream(code, store);

  return (
    <TradeStoreContext.Provider value={store}>{children}</TradeStoreContext.Provider>
  );
}

export function useTradeStore() {
  const store = useContext(TradeStoreContext);
  if (!store) throw new Error('TradeProvider is missing');
  return store;
}

export function useTrades() {
  const store = useTradeStore();
  return useSyncExternalStore(
    (l) => store.subscribe(l),
    () => store.getTrades(),
    () => store.getTrades(),
  );
}
