'use client';

import { TradingOrderDto } from '@chart/shared-types';
import { ExternalStoreBase } from '../_base/ExternalStoreBase';
import { KeyedExternalStoreBase } from '../_base/KeyedExternalStoreBase';

type Listener = () => void;

class ListBus extends ExternalStoreBase {
  emit() {
    this.notify();
  }
}

function timeKey(o: TradingOrderDto) {
  return typeof o.createdAt === 'string'
    ? Date.parse(o.createdAt)
    : o.createdAt.getTime();
}

function insertSortedByCreatedAtDesc(
  ids: string[],
  orders: Map<string, TradingOrderDto>,
  newId: string,
) {
  // 기존에 존재한다면 재삽입하기 위해
  const filtered = ids.filter((id) => id !== newId);

  const target = orders.get(newId);
  if (!target) return filtered;

  const t = timeKey(target);

  let low = 0;
  let high = filtered.length;

  while (low < high) {
    const mid = (low + high) >> 1;

    const midOrder = orders.get(filtered[mid]);
    const midT = midOrder ? timeKey(midOrder) : 0;

    // 최신을 앞으로 보내기
    if (t > midT) high = mid;
    else low = mid + 1;
  }

  filtered.splice(low, 0, newId);
  return filtered;
}

export class OrdersStore extends KeyedExternalStoreBase<string> {
  private orders = new Map<string, TradingOrderDto>();

  private pendingIds: string[] = [];
  private completedIds: string[] = [];

  private cachedPending: TradingOrderDto[] = [];
  private cachedCompleted: TradingOrderDto[] = [];

  private pendingDirty = true;
  private completedDirty = true;

  private listBus = new ListBus();

  subscribeList(listener: Listener) {
    return this.listBus.subscribe(listener);
  }

  get(id: string) {
    return this.orders.get(id);
  }

  getPendingIds() {
    return this.pendingIds;
  }

  getCompletedIds() {
    return this.completedIds;
  }

  getPending() {
    if (this.pendingDirty) {
      this.cachedPending = this.pendingIds
        .map((id) => this.orders.get(id))
        .filter(Boolean) as TradingOrderDto[];

      this.pendingDirty = false;
    }

    return this.cachedPending;
  }

  getCompleted() {
    if (this.completedDirty) {
      this.cachedCompleted = this.completedIds
        .map((id) => this.orders.get(id))
        .filter(Boolean) as TradingOrderDto[];
      this.completedDirty = false;
    }

    return this.cachedCompleted;
  }

  hydrate(orders: TradingOrderDto[]) {
    this.orders = new Map(orders.map((o) => [o.id, o]));

    this.pendingIds = orders
      .filter((o) => o.status === 'OPEN')
      .slice()
      .sort((a, b) => timeKey(b) - timeKey(a))
      .map((o) => o.id);

    this.completedIds = orders
      .filter((o) => o.status !== 'OPEN')
      .slice()
      .sort((a, b) => timeKey(b) - timeKey(a))
      .map((o) => o.id);

    this.pendingDirty = true;
    this.completedDirty = true;

    for (const id of this.getSubscribedKeys()) {
      this.notifyKey(id);
    }

    this.listBus.emit();
  }

  upsertFromStream(order: TradingOrderDto) {
    // const prev = this.orders.get(order.id);

    this.orders.set(order.id, order);
    this.notifyKey(order.id);

    const wasPending = this.pendingIds.includes(order.id);
    const wasCompleted = this.completedIds.includes(order.id);
    let listChanged = false;

    if (order.status === 'OPEN') {
      this.pendingIds = insertSortedByCreatedAtDesc(
        this.pendingIds,
        this.orders,
        order.id,
      );

      // 만약 이전에 없던 주문이거나, 완료된 상태에서 다시 열린 상태로 변경되었을 때
      if (wasCompleted) {
        this.completedIds = this.completedIds.filter((id) => id !== order.id);
      }

      if (!wasPending || wasCompleted) listChanged = true;
    } else {
      this.completedIds = insertSortedByCreatedAtDesc(
        this.completedIds,
        this.orders,
        order.id,
      );

      // 이전에 pending에 있던 주문일경우
      if (wasPending) {
        this.pendingIds = this.pendingIds.filter((id) => id !== order.id);
      }

      if (wasPending || !wasCompleted) listChanged = true;
    }

    if (listChanged) {
      this.pendingDirty = true;
      this.completedDirty = true;
      this.listBus.emit();
    }
  }
}
