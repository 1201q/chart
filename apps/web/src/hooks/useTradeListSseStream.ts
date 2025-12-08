'use client';

import { useEffect, useRef, useState } from 'react';
import { MarketTradeWithId } from '@chart/shared-types';
import { tradeStore } from '@/utils/tradeStore';

export const useTradeListSseStream = (
  code: string,
  initialSnapshot: MarketTradeWithId[],
) => {
  const eventSourceRef = useRef<EventSource | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    tradeStore.hydrate(code, initialSnapshot);
  }, [code, initialSnapshot]);

  // sse
  useEffect(() => {
    const encodedCode = encodeURIComponent(code);
    const url = `http://localhost:8000/sse/trade/${encodedCode}`;

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      console.log('SSE connection opened.');
      setConnected(true);
    };

    es.onerror = (err) => {
      console.error('SSE connection error:', err);
      setConnected(false);
    };

    es.addEventListener('realtime', (event) => {
      try {
        const payload = JSON.parse(event.data);

        const item = payload as MarketTradeWithId;

        tradeStore.pushTrades(code, item);
      } catch (error) {
        console.error('Failed to parse trade event data:', error);
      }
    });

    return () => {
      es.close();
      eventSourceRef.current = null;
      setConnected(false);
    };
  }, [code]);

  return { connected };
};
