'use client';

import { OrderFormStoreContext } from '@/utils/context/store.context';
import { OrderFormStore } from '@/utils/stores/orderform.store';
import { useState } from 'react';

export function NewOrderFormProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => new OrderFormStore());

  return (
    <OrderFormStoreContext.Provider value={store}>
      {children}
    </OrderFormStoreContext.Provider>
  );
}
