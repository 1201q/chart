import {
  TradingBalanceDto,
  TradingFillDto,
  TradingOrderDto,
  TradingSseEvent,
} from '@chart/shared-types';
import { BalancesStore } from './BalancesStore';
import { OrdersStore } from './OrdersStore';
import { FillsStore } from './FillsStore';

export class MarketTradingStore {
  balances = new BalancesStore();
  orders = new OrdersStore();
  fills = new FillsStore();

  constructor(public readonly code: string) {}

  hydrate(
    balances: TradingBalanceDto[],
    ordersByCode: (TradingOrderDto & { fills: TradingFillDto[] })[],
  ) {
    this.balances.hydrate(balances);

    const ordersOnly = ordersByCode.map(({ fills, ...order }) => order);
    this.orders.hydrate(ordersOnly);

    for (const o of ordersByCode) {
      if (o.fills?.length) {
        this.fills.hydrate(o.id, o.fills);
      }
    }
  }

  apply(ev: TradingSseEvent) {
    switch (ev.type) {
      case 'snapshot': {
        // this.hydrate(ev.data.balances, ev.data.)
        return;
      }
      case 'balance': {
        this.balances.updateAllFromStream(ev.data);
        return;
      }
      case 'position': {
        // positionsStore.upsertFromStream(ev.data);
        return;
      }
      case 'order': {
        this.orders.upsertFromStream(ev.data);
        return;
      }
      case 'fill': {
        this.fills.upsert(ev.data);
        return;
      }
      case 'heartbeat':
        return;
    }
  }
}
