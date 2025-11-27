'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  MarketTicker,
  MarketTickerWithNames,
  MarketTickerWithNamesMap,
} from '@chart/shared-types';

export const useTickerSse = (initialSnapshot: MarketTickerWithNamesMap) => {
  const [tickersMap, setTickersMap] = useState<MarketTickerWithNamesMap>(
    () => initialSnapshot,
  );
  const [connected, setConnected] = useState<boolean>(false);

  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    setTickersMap(initialSnapshot);
    console.log(initialSnapshot);
  }, [initialSnapshot]);

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
        const code = data.code;

        setTickersMap((prev) => {
          const prevTicker = prev[code];

          const merged: MarketTickerWithNames = {
            ...prevTicker, // korean_name, english_name 유지
            ...data, // 그 외 새로운 데이터로 덮어쓰기
          };

          return {
            ...prev,
            [code]: merged,
          };
        });
      } catch (error) {
        console.error('Failed to parse SSE data', error);
      }
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, []);

  // 렌더용 배열
  const tickers = useMemo(
    () =>
      Object.values(tickersMap).sort((a, b) => b.accTradePrice24h - a.accTradePrice24h),
    [tickersMap],
  );

  return { tickers, connected };
};
