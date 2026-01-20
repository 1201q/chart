import { TradingBalanceDto, TradingOrderDto, TradingSseEvent } from '@chart/shared-types';
import { BalancesStore } from './BalancesStore';
import { OrdersStore } from './OrdersStore';

export class MarketTradingStore {
  balances = new BalancesStore();
  orders = new OrdersStore();

  constructor(public readonly code: string) {}

  hydrate(balances: TradingBalanceDto[], ordersByCode: TradingOrderDto[]) {
    this.balances.hydrate(balances);
    this.orders.hydrate(ordersByCode);
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
        // fillsStore.append(ev.data);
        return;
      }
      case 'heartbeat':
        return;
    }
  }
}
