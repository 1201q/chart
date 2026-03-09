'use client';

import { useEffect } from 'react';
import { useTickerSelector2 } from '@/hooks/uses/tickers.hooks';
import { useOrderFormActions, useOrderFormSelector } from '@/hooks/uses/orderform.hooks';

export default function NewOrderFormInit({ code }: { code: string }) {
  const tradePrice = useTickerSelector2(code, (t) => t?.tradePrice ?? null);
  const store = useOrderFormActions();

  const price = useOrderFormSelector((s) => s.price); // 빈 값인가?
  const priceTouched = useOrderFormSelector((s) => s.priceTouched); // 터치된 적 있는가?

  useEffect(() => {
    if (!tradePrice) return;
    if (priceTouched) return;
    if (price !== null) return;

    store.initPriceOnce(tradePrice);
  }, [tradePrice, price, store, priceTouched]);

  return null;
}
