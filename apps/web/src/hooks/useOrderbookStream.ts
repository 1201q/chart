'use client';

import { OrderbookRowStore } from '@/utils/stores/new/OrderbookRowStore';
import { createTrackedEventSource } from '@/utils/perf/sse';

import { MarketOrderbook } from '@chart/shared-types';
import { useEffect } from 'react';

export function useOrderbookStream(code: string, store: OrderbookRowStore) {
  useEffect(() => {
    const encoded = encodeURIComponent(code);
    const url = `${process.env.NEXT_PUBLIC_API_URL}/sse/orderbook/${encoded}`;
    const es = createTrackedEventSource({ key: `orderbook:${code}`, url, firstEventTypes: ['realtime'] });

    const onRealtime = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as MarketOrderbook;

        store.updateFromStream(data);
      } catch (error) {
        console.error('Failed to parse orderbook stream data:', error);
      }
    };

    es.addEventListener('realtime', onRealtime);

    es.onerror = (err) => {
      console.error('Orderbook SSE error', err);
    };

    return () => {
      es.removeEventListener('realtime', onRealtime);
      es.close();
    };
  }, [code, store]);
}
