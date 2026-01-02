'use client';

import { useEffect, useRef, useState } from 'react';
import { TradingSnapshot, TradingSseEvent } from '@chart/shared-types';

import { balancesStore } from '@/utils/balancesStore';
import { positionsStore } from '@/utils/positionsStore';
import { ordersStore } from '@/utils/ordersStore';
import { fillsStore } from '@/utils/fillsStore';

export const useTradingSseStream = () => {
  const eventSourceRef = useRef<EventSource | null>(null);
  const [connected, setConnected] = useState(false);

  // sse
  useEffect(() => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/sse/trading`;

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
      const snapshot = JSON.parse(event.data) as TradingSnapshot;
      console.log(snapshot);
      handleSnapshotEvent(snapshot);
    });

    es.onmessage = (event) => {
      const ev = JSON.parse(event.data) as TradingSseEvent;
      console.log(ev);
      handleTradingSseEvent(ev);
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
      setConnected(false);
    };
  }, []);

  return { connected };
};

const handleTradingSseEvent = (ev: TradingSseEvent) => {
  switch (ev.type) {
    case 'heartbeat':
      return;
    case 'snapshot': {
      const snapshot = ev.data;

      balancesStore.hydrate(snapshot.balances);
      positionsStore.hydrate(snapshot.positions);
      ordersStore.hydrateOpenOrders(snapshot.openOrders);
      fillsStore.hydrateRecentFills(snapshot.recentFills);
      return;
    }
    case 'balance': {
      balancesStore.updateAll(ev.data);
      return;
    }
    case 'position': {
      positionsStore.upsertFromStream(ev.data);
      return;
    }
    case 'order': {
      ordersStore.upsertFromStream(ev.data);
      return;
    }
    case 'fill': {
      fillsStore.append(ev.data);
      return;
    }
  }
};

const handleSnapshotEvent = (s: TradingSnapshot) => {
  balancesStore.hydrate(s.balances);
  positionsStore.hydrate(s.positions);
  ordersStore.hydrateOpenOrders(s.openOrders);
  fillsStore.hydrateRecentFills(s.recentFills);
};
