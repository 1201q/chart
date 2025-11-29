/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useRef, useState } from 'react';
import { MarketTrade } from '@chart/shared-types';

const MAX_TRADES = 50;

interface UseTradeListOptions {
  maxTrades?: number;
}

export const useTradeListSseStream = (
  code: string,
  initialSnapshot: MarketTrade[],
  options?: UseTradeListOptions,
) => {
  const maxTrades = options?.maxTrades ?? MAX_TRADES;

  const [trades, setTrades] = useState<MarketTrade[]>(() => {
    const sorted = [...initialSnapshot].sort(
      (a, b) => b.tradeTimestamp - a.tradeTimestamp,
    );

    return sorted.slice(0, maxTrades);
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const [connected, setConnected] = useState(false);

  // 스냅샷 변경 시 초기화
  useEffect(() => {
    const sorted = [...initialSnapshot].sort(
      (a, b) => b.tradeTimestamp - a.tradeTimestamp,
    );
    const trimmed = sorted.slice(0, maxTrades);

    setTrades(trimmed);
  }, [code, initialSnapshot, maxTrades]);

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

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const items: MarketTrade[] = Array.isArray(payload) ? payload : [payload];

        setTrades((prev) => {
          let next = prev;

          for (const t of items) {
            next = [t, ...next];
          }

          if (next === prev) return prev;

          // 개수 제한
          if (next.length > maxTrades) {
            next = next.slice(0, maxTrades);
          }

          return next;
        });
      } catch (error) {
        console.error('Failed to parse trade event data:', error);
      }
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
      setConnected(false);
    };
  }, [code, maxTrades]);

  return { trades, connected };
};
