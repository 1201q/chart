import { OrderbookStoreContext } from '@/utils/context/store.context';
import { useContext, useSyncExternalStore } from 'react';

export function useOrderbookRow(index: number) {
  const store = useOrderbookRowStore();

  return useSyncExternalStore(
    (l) => store.subscribeKey(index, l),
    () => store.getRow(index),
    () => store.getRow(index),
  );
}

export function useOrderbookBalance() {
  const store = useOrderbookRowStore();

  return useSyncExternalStore(
    (l) => store.subscribeBalance(l),
    () => store.getBalance(),
    () => store.getBalance(),
  );
}
export function useOrderbookRowStore() {
  const store = useContext(OrderbookStoreContext);
  if (!store) throw new Error('OrderbookRowProvider is missing');
  return store;
}
