'use client';

import { useEffect, useRef, useState } from 'react';
import { useSyncExternalStore } from 'react';
import {
  MarketTicker,
  MarketTickerWithNames,
  MarketTickerWithNamesMap,
} from '@chart/shared-types';
import { tickerStore } from '../utils/tickerStore';

export const useTickerSse2 = (initialSnapshot: MarketTickerWithNamesMap) => {
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  tickerStore.hydrate(initialSnapshot);

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

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as MarketTicker;
        tickerStore.upsertFromStream(data);
      } catch (error) {
        console.error('Failed to parse SSE data', error);
      }
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, []);

  // 외부 스토어 구독
  const tickers = useSyncExternalStore<MarketTickerWithNames[]>(
    (listener) => tickerStore.subscribe(listener),
    () => tickerStore.getAll(),
    () => tickerStore.getAll(),
  );

  return { tickers, connected };
};
