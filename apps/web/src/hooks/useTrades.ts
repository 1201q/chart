'use client';

import { useSyncExternalStore } from 'react';
import { MarketTradeWithId } from '@chart/shared-types';
import { tradeStore } from '@/utils/tradeStore';

export function useTrades(): MarketTradeWithId[] {
  return useSyncExternalStore(
    (listener) => tradeStore.subscribe(listener),
    () => tradeStore.getTrades(),
    () => tradeStore.getTrades(),
  );
}
