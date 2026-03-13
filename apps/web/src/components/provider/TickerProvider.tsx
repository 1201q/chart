'use client';

import { useTickerStream } from '@/hooks/useTickerStream';
import { TickerStoreContext } from '@/utils/context/store.context';
import { positionsStore } from '@/utils/stores/positions.store';

import { TickerStore } from '@/utils/stores/new/TickerStore';

import { MarketTickerWithNamesMap, TradingPositionDto } from '@chart/shared-types';
import { useState } from 'react';

export function NewTickerProvider({
  initialSnapshot,
  initialFavorites = [],
  initialPositions = [],
  children,
}: {
  initialSnapshot: MarketTickerWithNamesMap;
  initialFavorites?: string[];
  initialPositions?: TradingPositionDto[];
  children: React.ReactNode;
}) {
  const [store] = useState(() => {
    const s = new TickerStore(initialSnapshot);
    if (initialFavorites.length > 0) {
      s.setWatchlistCodes(initialFavorites);
    }
    if (initialPositions.length > 0) {
      positionsStore.hydrate(initialPositions);
      s.setHoldingCodes(initialPositions.map((p) => p.market));
    }
    return s;
  });

  useTickerStream(store);

  return (
    <TickerStoreContext.Provider value={store}>{children}</TickerStoreContext.Provider>
  );
}
