'use client';

import { useTradeStream } from '@/hooks/useTradeStream';
import { TradeStoreContext } from '@/utils/context/store.context';
import { TradeStore } from '@/utils/stores/new/TradeStore';
import { MarketTradeWithId } from '@chart/shared-types';
import { useState } from 'react';

export function NewTradeProvider({
  code,
  initialSnapshot,
  children,
}: {
  code: string;
  initialSnapshot: MarketTradeWithId[];
  children: React.ReactNode;
}) {
  const [store] = useState(() => new TradeStore(initialSnapshot, 50));

  useTradeStream(code, store);

  return (
    <TradeStoreContext.Provider value={store}>{children}</TradeStoreContext.Provider>
  );
}
