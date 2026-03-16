'use client';

import { useTickerStream } from '@/hooks/useTickerStream';
import { TickerStoreContext } from '@/utils/context/store.context';
import { positionsStore } from '@/utils/stores/positions.store';

import { TickerStore } from '@/utils/stores/new/TickerStore';
import { getOrCreateTickerStore } from '@/utils/stores/new/tickerStoreSingleton';

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

/**
 * 루트 레이아웃에 마운트하는 싱글톤 Provider.
 * SSE를 레이아웃 수준에서 유지해 홈↔마켓 전환 시 재연결을 방지한다.
 *
 * Hydration mismatch 방지:
 * SSE 메시지는 store 내부에서 큐잉되며, Suspense 경계 안쪽의
 * TickerContextHydrator가 store.setHydrated()를 호출한 뒤에야 적용된다.
 * 따라서 페이지 hydration 완료 전에 SSE가 연결되어도 snapshot 불일치가 없다.
 */
export function RootTickerProvider({
  initialSnapshot,
  children,
}: {
  initialSnapshot: MarketTickerWithNamesMap;
  children: React.ReactNode;
}) {
  const [store] = useState(() => getOrCreateTickerStore(initialSnapshot));

  useTickerStream(store);

  return (
    <TickerStoreContext.Provider value={store}>{children}</TickerStoreContext.Provider>
  );
}
