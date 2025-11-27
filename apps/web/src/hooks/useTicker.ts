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

export const useTickers = (): MarketTickerWithNames[] => {
  return useSyncExternalStore(
    (listener) => tickerStore.subscribe(listener),
    () => tickerStore.getAll(),
    () => tickerStore.getAll(),
  );
};

export const useTickerCodes = (): string[] => {
  return useSyncExternalStore(
    (listener) => tickerStore.subscribe(listener),
    () => tickerStore.getSortedCodes(),
    () => tickerStore.getSortedCodes(),
  );
};
