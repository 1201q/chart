'use client';

import { TradeStore } from '@/utils/stores/new/TradeStore';
import { MarketTradeWithId } from '@chart/shared-types';
import { useEffect } from 'react';

export function useTradeStream(code: string, store: TradeStore) {
  useEffect(() => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/sse/trade/${encodeURIComponent(code)}`;
    const es = new EventSource(url);

    es.addEventListener('realtime', (event) => {
      try {
        const data = JSON.parse(event.data) as MarketTradeWithId;

        store.upsertFromStream(data);
      } catch (error) {
        console.error('Failed to parse trade stream data:', error);
      }
    });

    es.onerror = (err) => {
      console.error('Trade SSE error', err);
    };

    return () => es.close();
  }, [code, store]);
}
