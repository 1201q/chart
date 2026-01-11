'use client';

import { TickerStore } from '@/utils/stores/TickerStore';

import { MarketTicker } from '@chart/shared-types';
import { useEffect } from 'react';

export function useTickerStream(store: TickerStore) {
  useEffect(() => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/sse/tickers`;
    const es = new EventSource(url);

    es.addEventListener('realtime', (event) => {
      try {
        const data = JSON.parse(event.data) as MarketTicker;
        store.upsertFromStream(data);
      } catch (error) {
        console.error('Failed to parse ticker stream data:', error);
      }
    });

    es.onerror = (err) => {
      console.error('Ticker SSE error', err);
    };

    return () => es.close();
  }, [store]);
}
