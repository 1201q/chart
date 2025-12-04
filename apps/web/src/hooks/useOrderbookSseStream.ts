/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useRef, useState } from 'react';

import { MarketOrderbook } from '@chart/shared-types';

export type OrderbookRow = {
  price: number;
  askSize: number;
  bidSize: number;
  askWidth: number;
  bidWidth: number;
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
  const rows: { price: number; askSize: number; bidSize: number }[] = Array.from(
    {
      length: rowCount,
    },
    (_, i) => {
      if (i < half) {
        const ask = asks[i];
        return {
          price: ask?.price ?? 0,
          askSize: ask?.size ?? 0,
          bidSize: 0,
        };
      } else {
        const bid = bids[rowCount - 1 - i];
        return {
          price: bid?.price ?? 0,
          askSize: 0,
          bidSize: bid?.size ?? 0,
        };
      }
    },
  );

  const totalAsk = rows.reduce((sum, a) => sum + a.askSize, 0);
  const toalBid = rows.reduce((sum, a) => sum + a.bidSize, 0);

  const rawAskWidths = rows.map((r) => (totalAsk > 0 ? (r.askSize / totalAsk) * 700 : 0));
  const rawBidWidths = rows.map((r) => (toalBid > 0 ? (r.bidSize / toalBid) * 700 : 0));

  const maxAskOver100 = Math.max(...rawAskWidths.filter((w) => w > 100), 0);
  const maxBidOver100 = Math.max(...rawBidWidths.filter((w) => w > 100), 0);

  const askScale = maxAskOver100 > 0 ? 100 / maxAskOver100 : 1;
  const bidScale = maxBidOver100 > 0 ? 100 / maxBidOver100 : 1;

  const results: OrderbookRow[] = rows.map((r, i) => ({
    price: r.price,
    askSize: r.askSize,
    bidSize: r.bidSize,
    askWidth: Number((rawAskWidths[i] * askScale).toFixed(2)) || 0,
    bidWidth: Number((rawBidWidths[i] * bidScale).toFixed(2)) || 0,
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
