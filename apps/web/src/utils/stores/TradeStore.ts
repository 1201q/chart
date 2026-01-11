'use client';

import { MarketTradeWithId } from '@chart/shared-types';
import { ExternalStoreBase } from '@/utils/stores/_base/ExternalStoreBase';

export class TradeStore extends ExternalStoreBase {
  private trades: MarketTradeWithId[] = [];
  private ids = new Set<string>();
  private readonly MAX_TRADES: number;

  constructor(initialSnapshot: MarketTradeWithId[], maxTrades = 50) {
    super();
    this.MAX_TRADES = maxTrades;
    this.hydrate(initialSnapshot);
  }

  private hydrate(snapshot: MarketTradeWithId[]) {
    const ids = new Set<string>();

    const sorted = snapshot.slice().sort((a, b) => b.tradeTimestamp - a.tradeTimestamp);

    const next: MarketTradeWithId[] = [];
    for (const t of sorted) {
      const id = String(t.id);
      if (ids.has(id)) continue;
      ids.add(id);
      next.push(t);
      if (next.length >= this.MAX_TRADES) break;
    }

    this.trades = next;
    this.ids = ids;
  }

  getTrades() {
    return this.trades;
  }

  /** SSE patch 1건 들어왔을 때 */
  upsertFromStream(newTrade: MarketTradeWithId) {
    const id = String(newTrade.id);

    // 이미 있으면 교체
    if (this.ids.has(id)) {
      const idx = this.trades.findIndex((t) => String(t.id) === id);
      if (idx !== -1) {
        const copy = this.trades.slice();
        copy[idx] = newTrade;
        // timestamp가 바뀔 수도 있으니 정렬 유지
        copy.sort((a, b) => b.tradeTimestamp - a.tradeTimestamp);
        this.trades = copy;
        this.notify();
      }
      return;
    }

    // 신규면 추가 + trim
    const merged = [newTrade, ...this.trades].sort(
      (a, b) => b.tradeTimestamp - a.tradeTimestamp,
    );

    const trimmed = merged.slice(0, this.MAX_TRADES);

    const nextIds = new Set<string>();
    for (const t of trimmed) nextIds.add(String(t.id));

    this.trades = trimmed;
    this.ids = nextIds;

    this.notify();
  }
}
