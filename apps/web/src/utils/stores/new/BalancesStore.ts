import { TradingBalanceDto } from '@chart/shared-types';
import { KeyedExternalStoreBase } from '../_base/KeyedExternalStoreBase';

export class BalancesStore extends KeyedExternalStoreBase<string> {
  private balances = new Map<string, TradingBalanceDto>();

  hydrate(initialSnapshot: TradingBalanceDto[]) {
    this.balances = new Map(initialSnapshot.map((b) => [b.currency, b]));

    for (const key of this.balances.keys()) {
      this.notifyKey(key);
    }
  }

  get(currency: string) {
    return this.balances.get(currency);
  }

  upsertFromStream(update: TradingBalanceDto) {
    const prev = this.balances.get(update.currency);
    if (!prev) return;

    this.balances.set(update.currency, update);
    this.notifyKey(update.currency);
  }

  updateAllFromStream(list: TradingBalanceDto[]) {
    for (const b of list) {
      this.upsertFromStream(b);
    }
  }
}
