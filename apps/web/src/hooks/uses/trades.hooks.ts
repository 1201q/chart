import { TradeStoreContext } from '@/utils/context/store.context';
import { useContext, useSyncExternalStore } from 'react';

export function useTrades() {
  const store = useTradeStore();
  return useSyncExternalStore(
    (l) => store.subscribe(l),
    () => store.getTrades(),
    () => store.getTrades(),
  );
}

export function useTradeStore() {
  const store = useContext(TradeStoreContext);
  if (!store) throw new Error('TradeProvider is missing');
  return store;
}
