import { useOrderFormActions, useOrderFormSelector } from './uses/orderform.hooks';
import { useTickerSelector2 } from './uses/tickers.hooks';
import { useBalance } from './uses/trading.hooks';

export function useOrderFormQty(code: string) {
  const store = useOrderFormActions();

  const side = useOrderFormSelector((s) => s.side);
  const price = useOrderFormSelector((s) => s.price);

  const tradePrice = useTickerSelector2(code, (s) => s?.tradePrice ?? null);

  const krwAvailable = useBalance('KRW')?.available ?? 0;
  const coinAvailable = useBalance(code.replace('KRW-', ''))?.available ?? 0;

  const effectivePrice = price ?? tradePrice ?? null;

  const setQtyByRatio = (ratio: number) => {
    if (!effectivePrice) return;

    if (side === 'BUY') {
      const spend = Number(krwAvailable) * ratio;
      const qty = spend / effectivePrice;

      store.setQty(qty, true);
    } else {
      const qty = Number(coinAvailable) * ratio;
      store.setQty(qty, true);
    }
  };

  return {
    set10: () => setQtyByRatio(0.1),
    set25: () => setQtyByRatio(0.25),
    set50: () => setQtyByRatio(0.5),
    set100: () => setQtyByRatio(1),
  };
}
