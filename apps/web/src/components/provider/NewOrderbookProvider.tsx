'use client';

import { useOrderbookStream } from '@/hooks/useOrderbookStream';
import { OrderbookStoreContext } from '@/utils/context/store.context';
import { OrderbookRowStore } from '@/utils/stores/new/OrderbookRowStore';
import { MarketOrderbook } from '@chart/shared-types';

import { useState } from 'react';

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

  return (
    <OrderbookStoreContext.Provider value={store}>
      {children}
    </OrderbookStoreContext.Provider>
  );
}
