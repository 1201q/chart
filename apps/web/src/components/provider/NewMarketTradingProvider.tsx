'use client';

import { MarketTradingStoreContext } from '@/utils/context/store.context';
import { MarketTradingStore } from '@/utils/stores/new/MarketTradingStore';

import { TradingBalanceDto, TradingOrderDto } from '@chart/shared-types';
import { useEffect, useMemo } from 'react';
import { TradingSseEvent } from '@chart/shared-types';

interface MarketTradingProviderProps {
  code: string;
  balances: TradingBalanceDto[];
  orders: TradingOrderDto[];
  children: React.ReactNode;
}

export function NewMarketTradingProvider({
  code,
  children,
  orders,
  balances,
}: MarketTradingProviderProps) {
  const store = useMemo(() => new MarketTradingStore(code), [code]);

  useEffect(() => {
    store.hydrate(balances, orders);

    const url = `${process.env.NEXT_PUBLIC_API_URL}/sse/trading`;
    const es = new EventSource(url);

    es.addEventListener('trading', (event) => {
      const data = JSON.parse(event.data) as TradingSseEvent;
      store.apply(data);
    });

    return () => {
      es.close();
    };
  }, [code, store, balances, orders]);

  return (
    <MarketTradingStoreContext.Provider value={store}>
      {children}
    </MarketTradingStoreContext.Provider>
  );
}
