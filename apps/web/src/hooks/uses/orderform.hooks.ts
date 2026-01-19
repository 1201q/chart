import { OrderFormStoreContext } from '@/utils/context/store.context';
import { OrderFormState } from '@/utils/stores/orderform.store';
import { useContext, useSyncExternalStore } from 'react';

export function useOrderFormStore() {
  const store = useContext(OrderFormStoreContext);
  if (!store) throw new Error('OrderFormProvider is missing');
  return store;
}

export function useOrderFormSelector<T>(selector: (s: OrderFormState) => T) {
  const store = useOrderFormStore();

  const getClientSnapshot = () => selector(store.getSnapshot());
  const getServerSnapshot = () => selector(store.getSnapshot());

  return useSyncExternalStore(store.subscribe, getClientSnapshot, getServerSnapshot);
}

export function useOrderFormActions() {
  const store = useOrderFormStore();
  return store;
}
