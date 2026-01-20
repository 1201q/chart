'use client';

import { useTickerStream } from '@/hooks/useTickerStream';
import { TickerStoreContext } from '@/utils/context/store.context';

import { TickerStore } from '@/utils/stores/new/TickerStore';

import { MarketTickerWithNamesMap } from '@chart/shared-types';
import { useState } from 'react';

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
