'use client';

import { useOrderbookStream } from '@/hooks/useOrderbookStream';
import { OrderbookRowStore } from '@/utils/stores/OrderbookRowStore';
import { MarketOrderbook } from '@chart/shared-types';

import { createContext, useContext, useState } from 'react';

const Context = createContext<OrderbookRowStore | null>(null);

export function NewOrderbookProvider({
  code,
  initialSnapshot,
  children,
}: {
  code: string;
  initialSnapshot: MarketOrderbook;
  children: React.ReactNode;
}) {
  const [store] = useState(() => new OrderbookRowStore(initialSnapshot, 60));

  useOrderbookStream(code, store);

  return <Context.Provider value={store}>{children}</Context.Provider>;
}

export function useOrderbookRowStore() {
  const store = useContext(Context);
  if (!store) throw new Error('OrderbookRowProvider is missing');
  return store;
}
