'use client';

import { useEffect, useRef, useState } from 'react';
import { TradingSseEvent } from '@chart/shared-types';

import { balancesStore } from '@/utils/balancesStore';
import { positionsStore } from '@/utils/positionsStore';
import { ordersStore } from '@/utils/ordersStore';
import { fillsStore } from '@/utils/fillsStore';

export const useTradingSseStream = () => {
  const eventSourceRef = useRef<EventSource | null>(null);
  const [connected, setConnected] = useState(false);

  // sse
  useEffect(() => {
    // connecting
    balancesStore.setConnecting();
    positionsStore.setConnecting();
    ordersStore.setConnecting();
    fillsStore.setConnecting();

    const url = `${process.env.NEXT_PUBLIC_API_URL}/sse/trading`;

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      console.log('SSE connection opened.');
      setConnected(true);
    };

    es.onerror = (err) => {
      console.error('SSE connection error:', err);

      balancesStore.setError(err);
      positionsStore.setError(err);
      ordersStore.setError(err);
      fillsStore.setError(err);

      setConnected(false);
    };

    es.addEventListener('trading', (event) => {
      const data = JSON.parse(event.data) as TradingSseEvent;

      handleTradingSseEvent(data);
    });

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
      balancesStore.upsertFromStream(ev.data);
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
