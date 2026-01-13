import { useOrderbookRowStore } from '@/components/provider/NewOrderbookProvider';
import { useSyncExternalStore } from 'react';

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
