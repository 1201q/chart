import { MarketOrderbook } from '@chart/shared-types';
import { D } from 'src/common/helpers/decimal';

export type OrderbookLevel = { price: ReturnType<typeof D>; size: ReturnType<typeof D> };

export function buildOrderbookLevels(ob: MarketOrderbook) {
  // BUY는 asks(싼 가격부터), SELL은 bids(비싼 가격부터)
  const asks: OrderbookLevel[] = ob.units
    .map((u) => ({ price: D(String(u.askPrice)), size: D(String(u.askSize)) }))
    .filter((l) => l.size.gt(0))
    .sort((a, b) => a.price.comparedTo(b.price)); // 오름차순

  const bids: OrderbookLevel[] = ob.units
    .map((u) => ({ price: D(String(u.bidPrice)), size: D(String(u.bidSize)) }))
    .filter((l) => l.size.gt(0))
    .sort((a, b) => b.price.comparedTo(a.price)); // 내림차순

  return { asks, bids };
}
