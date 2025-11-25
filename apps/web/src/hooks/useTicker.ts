'use client';

import { useSyncExternalStore } from 'react';
import { tickerStore } from '../utils/tickerStore';
import { MarketTickerWithNames } from '@chart/shared-types';

export function useTicker(code: string): MarketTickerWithNames | undefined {
  return useSyncExternalStore(
    (listener) => tickerStore.subscribe(listener),
    () => tickerStore.getTicker(code),
    () => tickerStore.getTicker(code),
  );
}
