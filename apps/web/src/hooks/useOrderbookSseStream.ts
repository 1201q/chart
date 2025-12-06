/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useRef, useState } from 'react';
import { MarketOrderbook } from '@chart/shared-types';

export type OrderbookRow = {
  price: number;
  size: number;
  width: number;
};

function buildOrderbookRows(
  units: MarketOrderbook['units'],
  rowCount = 60,
): OrderbookRow[] {
  const half = rowCount / 2;

  const asks = units
    .map((u) => ({
      price: u.askPrice,
      size: u.askSize,
    }))
    .filter((u) => u.size > 0)
    .sort((a, b) => b.price - a.price); // 위에서 아래로

  const bids = units
    .map((u) => ({
      price: u.bidPrice,
      size: u.bidSize,
    }))
    .filter((u) => u.size > 0)
    .sort((a, b) => a.price - b.price); // 아래에서 위로

  // 위 15줄 asks[0 ~14], 아래 15줄 bids[14 ~ 0]
  const rows: { price: number; size: number }[] = Array.from(
    {
      length: rowCount,
    },
    (_, i) => {
      if (i < half) {
        const ask = asks[i];
        return {
          price: ask?.price ?? 0,
          size: ask?.size ?? 0,
        };
      } else {
        const bid = bids[rowCount - 1 - i];
        return {
          price: bid?.price ?? 0,
          size: bid?.size ?? 0,
        };
      }
    },
  );

  const total = rows.reduce((sum, a) => sum + a.size, 0);
  const widths = rows.map((r) => (total > 0 ? (r.size / total) * 700 : 0));

  const maxOver100 = Math.max(...widths.filter((w) => w > 100), 0);
  const scale = maxOver100 > 0 ? 100 / maxOver100 : 1;

  const results: OrderbookRow[] = rows.map((r, i) => ({
    price: r.price,
    size: r.size,
    width: Number((widths[i] * scale).toFixed(2)) || 0,
  }));

  return results;
}

export const useOrderbookSseStream = (code: string, initialSnapshot: MarketOrderbook) => {
  const [rows, setRows] = useState<OrderbookRow[]>(() =>
    initialSnapshot.units ? buildOrderbookRows(initialSnapshot.units) : [],
  );

  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (initialSnapshot.units) {
      setRows(buildOrderbookRows(initialSnapshot.units));
    }
  }, [code, initialSnapshot]);

  // sse 연결, 구독 설정
  useEffect(() => {
    const encodedCode = encodeURIComponent(code);
    const url = `http://localhost:8000/sse/orderbook/${encodedCode}`;

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
        const data = JSON.parse(event.data) as MarketOrderbook;
        setRows(buildOrderbookRows(data.units));
      } catch (error) {
        console.error('Failed to parse SSE data', error);
      }
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [code]);

  return { connected, rows };
};
