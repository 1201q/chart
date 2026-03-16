'use client';

import { useTickerStore } from '@/hooks/uses/tickers.hooks';
import { positionsStore } from '@/utils/stores/positions.store';
import { TradingPositionDto } from '@chart/shared-types';
import { useEffect } from 'react';

/**
 * RSC에서 가져온 즐겨찾기·보유 종목을 전역 TickerStore에 1회 hydration.
 * Suspense 경계 안쪽에서 마운트되므로, useEffect 실행 시점에
 * 페이지 콘텐츠 hydration이 완료된 상태가 보장된다.
 * 이 시점에 store.setHydrated()를 호출해 큐잉된 SSE 업데이트를 flush한다.
 */
export function TickerContextHydrator({
  favorites = [],
  positions = [],
}: {
  favorites?: string[];
  positions?: TradingPositionDto[];
}) {
  const store = useTickerStore();

  useEffect(() => {
    store.setHydrated();

    if (favorites.length > 0) {
      store.setWatchlistCodes(favorites);
    }
    if (positions.length > 0) {
      positionsStore.hydrate(positions);
      store.setHoldingCodes(positions.map((p) => p.market));
    }
  }, [store, favorites, positions]);

  return null;
}
