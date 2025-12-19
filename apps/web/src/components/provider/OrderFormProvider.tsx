/* eslint-disable react-hooks/refs */
'use client';

import { OrderFormState, OrderFormStore } from '@/utils/orderFormStore';
import { createContext, useContext, useRef, useSyncExternalStore } from 'react';

const Ctx = createContext<OrderFormStore | null>(null);

export function OrderFormProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<OrderFormStore | null>(null);

  if (!storeRef.current) {
    storeRef.current = new OrderFormStore();
  }

  return <Ctx.Provider value={storeRef.current}>{children}</Ctx.Provider>;
}

function useStore() {
  const store = useContext(Ctx);
  if (!store) throw new Error('OrderFormProvider is missing');
  return store;
}

export function useOrderFormSelector<T>(selector: (s: OrderFormState) => T) {
  const store = useStore();

  const getClientSnapshot = () => selector(store.getSnapshot());
  const getServerSnapshot = () => selector(store.getSnapshot());

  return useSyncExternalStore(store.subscribe, getClientSnapshot, getServerSnapshot);
}

export function useOrderFormActions() {
  const store = useStore();
  return store;
}
