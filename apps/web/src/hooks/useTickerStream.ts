'use client';

import { TickerStore } from '@/utils/stores/new/TickerStore';
import { createTrackedEventSource } from '@/utils/perf/sse';

import { MarketTicker } from '@chart/shared-types';
import { useEffect } from 'react';

export function useTickerStream(store: TickerStore) {
  useEffect(() => {
    const attach = () => {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/sse/tickers`;
      const es = createTrackedEventSource({ key: 'tickers', url, firstEventTypes: ['realtime'] });

      const onRealtime = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data) as MarketTicker;
          store.upsertFromStream(data);
        } catch (error) {
          console.error('Failed to parse ticker stream data:', error);
        }
      };

      es.addEventListener('realtime', onRealtime);

      es.onerror = (err) => {
        console.error('Ticker SSE error', err);
      };

      return () => {
        es.removeEventListener('realtime', onRealtime);
        es.close();
      };
    };

    let cleanup: (() => void) | null = null;
    const id = requestAnimationFrame(() => {
      cleanup = attach();
    });

    return () => {
      cancelAnimationFrame(id);
      if (cleanup) cleanup();
    };
  }, [store]);
}
