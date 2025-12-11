/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useRef, useState } from 'react';
import { MarketOrderbook } from '@chart/shared-types';

export type OrderbookRow = {
  price: number;
  size: number;
  width: number;
};

export type OrderbookBalance = {
  askTotal: number;
  bidTotal: number;
  askRatio: number; // 0~100
  bidRatio: number; // 0~100
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

function calcOrderbookBalance(units: MarketOrderbook['units']): OrderbookBalance {
  const askTotal = units.reduce((sum, u) => sum + (u.askSize ?? 0), 0);
  const bidTotal = units.reduce((sum, u) => sum + (u.bidSize ?? 0), 0);
  const total = askTotal + bidTotal || 1;

  const askRatio = (askTotal / total) * 100;
  const bidRatio = (bidTotal / total) * 100;

  return {
    askTotal,
    bidTotal,
    askRatio: Number(askRatio.toFixed(2)),
    bidRatio: Number(bidRatio.toFixed(2)),
  };
}

export const useOrderbookSseStream = (code: string, initialSnapshot: MarketOrderbook) => {
  const [rows, setRows] = useState<OrderbookRow[]>(() =>
    initialSnapshot.units ? buildOrderbookRows(initialSnapshot.units) : [],
  );

  const [balance, setBalance] = useState<OrderbookBalance>(() =>
    initialSnapshot.units
      ? calcOrderbookBalance(initialSnapshot.units)
      : {
        askTotal: 0,
        bidTotal: 0,
        askRatio: 50,
        bidRatio: 50,
      },
  );

  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (initialSnapshot.units) {
      setRows(buildOrderbookRows(initialSnapshot.units));
      setBalance(calcOrderbookBalance(initialSnapshot.units));
    }
  }, [code, initialSnapshot]);

  // sse 연결, 구독 설정
  useEffect(() => {
    const encodedCode = encodeURIComponent(code);
    const url = `${process.env.NEXT_PUBLIC_API_URL}/sse/orderbook/${encodedCode}`;

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

    es.addEventListener('snapshot', (event) => {
      try {
        const data = JSON.parse(event.data) as MarketOrderbook;
        setRows(buildOrderbookRows(data.units));
        setBalance(calcOrderbookBalance(data.units));
      } catch (error) {
        console.error('Failed to parse SSE data', error);
      }
    });

    es.addEventListener('realtime', (event) => {
      try {
        const data = JSON.parse(event.data) as MarketOrderbook;
        setRows(buildOrderbookRows(data.units));
        setBalance(calcOrderbookBalance(data.units));
      } catch (error) {
        console.error('Failed to parse SSE data', error);
      }
    });

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [code]);

  return { connected, rows, balance };
};
