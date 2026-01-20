import { MarketTradingStoreContext } from '@/utils/context/store.context';
import { useContext, useSyncExternalStore } from 'react';

export function useBalance(currency: string) {
  const store = useMarketTradingStore();

  return useSyncExternalStore(
    (l) => store.balances.subscribeKey(currency, l),
    () => store.balances.get(currency),
    () => store.balances.get(currency),
  );
}

export function usePendingOrders() {
  const store = useMarketTradingStore();

  return useSyncExternalStore(
    (l) => store.orders.subscribeList(l),
    () => store.orders.getPending(),
    () => store.orders.getPending(),
  );
}

export function useCompletedOrders() {
  const store = useMarketTradingStore();

  return useSyncExternalStore(
    (l) => store.orders.subscribeList(l),
    () => store.orders.getCompleted(),
    () => store.orders.getCompleted(),
  );
}

export function useMarketTradingStore() {
  const store = useContext(MarketTradingStoreContext);
  if (!store) throw new Error('MarketTradingProvider is missing');
  return store;
}
