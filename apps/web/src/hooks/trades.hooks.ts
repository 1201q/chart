import { useTradeStore } from '@/components/provider/NewTradeProvider';
import { useSyncExternalStore } from 'react';

export function useTrades() {
  const store = useTradeStore();
  return useSyncExternalStore(
    (l) => store.subscribe(l),
    () => store.getTrades(),
    () => store.getTrades(),
  );
}
