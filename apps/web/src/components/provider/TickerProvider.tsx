'use client';

import { useTickerStream } from '@/hooks/useTickerStream';
import { TickerStoreContext } from '@/utils/context/store.context';

import { TickerStore } from '@/utils/stores/new/TickerStore';

import { MarketTickerWithNamesMap } from '@chart/shared-types';
import { useState } from 'react';

export function NewTickerProvider({
  initialSnapshot,
  initialFavorites = [],
  children,
}: {
  initialSnapshot: MarketTickerWithNamesMap;
  initialFavorites?: string[];
  children: React.ReactNode;
}) {
  const [store] = useState(() => {
    const s = new TickerStore(initialSnapshot);
    if (initialFavorites.length > 0) {
      s.setWatchlistCodes(initialFavorites);
    }
    return s;
  });

  useTickerStream(store);

  return (
    <TickerStoreContext.Provider value={store}>{children}</TickerStoreContext.Provider>
  );
}
