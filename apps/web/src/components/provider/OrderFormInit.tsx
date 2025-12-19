'use client';

import { useTicker } from '@/hooks/useTicker';
import { useOrderFormActions, useOrderFormSelector } from './OrderFormProvider';
import { useEffect } from 'react';

export default function OrderFormInit({ code }: { code: string }) {
  const ticker = useTicker(code);
  const store = useOrderFormActions();

  const price = useOrderFormSelector((s) => s.price); // 빈 값인가?
  const priceTouched = useOrderFormSelector((s) => s.priceTouched); // 터치된 적 있는가?

  useEffect(() => {
    if (!ticker) return;
    if (priceTouched) return;
    if (price !== null) return;

    store.initPriceOnce(ticker.tradePrice);
  }, [ticker, price, store, priceTouched]);

  return null;
}
