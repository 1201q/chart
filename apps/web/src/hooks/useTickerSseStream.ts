'use client';

import { useEffect, useRef, useState } from 'react';

import { MarketTicker } from '@chart/shared-types';
import { tickerStore } from '../utils/tickerStore';

export const useTickerSseStream = () => {
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // sse 연결, 구독 설정
  useEffect(() => {
    const url = 'http://localhost:8000/sse/tickers';

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
        const data = JSON.parse(event.data) as MarketTicker;
        tickerStore.upsertFromStream(data);
      } catch (error) {
        console.error('Failed to parse SSE data', error);
      }
    });

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, []);

  return { connected };
};
