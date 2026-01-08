import type { OrdersView } from '../api/trading';

export const qk = {
  orders: (market: string, view: OrdersView) =>
    ['trading', 'orders', market, view] as const,
  balances: () => ['trading', 'balances'] as const,
  positions: () => ['trading', 'positions'] as const,
};
