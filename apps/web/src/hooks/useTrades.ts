'use client';

import { useSyncExternalStore } from 'react';
import { MarketTrade } from '@chart/shared-types';
import { tradeStore } from '@/utils/tradeStore';

export function useTrades(): MarketTrade[] {
  return useSyncExternalStore(
    (listener) => tradeStore.subscribe(listener),
    () => tradeStore.getTrades(),
    () => tradeStore.getTrades(),
  );
}
