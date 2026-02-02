'use client';

import { TradingFillDto, TradingFillWithOrderIdDto } from '@chart/shared-types';

import { KeyedExternalStoreBase } from '../_base/KeyedExternalStoreBase';

export type FillMetrics = {
  filledQty: number;
  filledSum: number; // price*qty의 합
  filledAvgPrice: number; // filledSum / filledQty
  filledCount: number;
};

const emptyFillMetrics: FillMetrics = {
  filledQty: 0,
  filledSum: 0,
  filledAvgPrice: 0,
  filledCount: 0,
};

export class FillsStore extends KeyedExternalStoreBase<string> {
  private metricsByOrderId = new Map<string, FillMetrics>();

  private seenFillIdsByOrderId = new Map<string, Set<string>>();

  getMetrics(orderId: string): FillMetrics {
    return this.metricsByOrderId.get(orderId) ?? emptyFillMetrics;
  }

  hydrate(orderId: string, nested: Omit<TradingFillDto, 'orderId'>[]) {
    for (const f of nested) {
      this.upsert({ ...f, orderId });
    }
  }

  upsert(fill: TradingFillWithOrderIdDto) {
    const orderId = fill.orderId;

    let seen = this.seenFillIdsByOrderId.get(orderId);
    if (!seen) {
      seen = new Set<string>();
      this.seenFillIdsByOrderId.set(orderId, seen);
    }
    if (seen.has(fill.id)) {
      return;
    }
    seen.add(fill.id);

    const prev = this.metricsByOrderId.get(orderId) ?? emptyFillMetrics;

    const qty = Number(fill.qty);
    const price = Number(fill.price);

    const filledQty = prev.filledQty + qty;
    const filledSum = prev.filledSum + price * qty;
    const filledAvgPrice = filledQty > 0 ? filledSum / filledQty : 0;

    const next: FillMetrics = {
      filledQty,
      filledSum,
      filledAvgPrice,
      filledCount: prev.filledCount + 1,
    };

    this.metricsByOrderId.set(orderId, next);
    this.notifyKey(orderId);
  }
}
