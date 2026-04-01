'use client';

import { MarketOrderbook } from '@chart/shared-types';
import { ExternalStoreBase } from '../_base/ExternalStoreBase';
import { KeyedExternalStoreBase } from '../_base/KeyedExternalStoreBase';

export type OrderbookRow = { price: number; size: number; width: number };

export type OrderbookBalance = {
  askTotal: number;
  bidTotal: number;
  askRatio: number; // 0~100
  bidRatio: number; // 0~100
};

type Listener = () => void;

class Bus extends ExternalStoreBase {
  emit() {
    this.notify();
  }
}

export function buildRows(units: MarketOrderbook['units'], rowCount = 60): OrderbookRow[] {
  const half = rowCount / 2;

  const asks = units
    .map((u) => ({
      price: u.askPrice,
      size: u.askSize,
    }))
    .filter((u) => u.size > 0)
    .sort((a, b) => b.price - a.price); // 위에서 아래로

  const bids = units
    .map((u) => ({
      price: u.bidPrice,
      size: u.bidSize,
    }))
    .filter((u) => u.size > 0)
    .sort((a, b) => a.price - b.price); // 아래에서 위로

  // 위 15줄 asks[0 ~14], 아래 15줄 bids[14 ~ 0]
  const rows = Array.from({ length: rowCount }, (_, i) => {
    if (i < half) {
      const ask = asks[i];
      return { price: ask?.price ?? 0, size: ask?.size ?? 0 };
    } else {
      const bid = bids[rowCount - 1 - i];
      return { price: bid?.price ?? 0, size: bid?.size ?? 0 };
    }
  });

  const total = rows.reduce((sum, a) => sum + a.size, 0);
  const widths = rows.map((r) => (total > 0 ? (r.size / total) * 700 : 0));

  const maxOver100 = Math.max(...widths.filter((w) => w > 100), 0);
  const scale = maxOver100 > 0 ? 100 / maxOver100 : 1;

  return rows.map((r, i) => ({
    price: r.price,
    size: r.size,
    width: Number((widths[i] * scale).toFixed(2)) || 0,
  }));
}

function calcBalance(units: MarketOrderbook['units']): OrderbookBalance {
  const askTotal = units.reduce((sum, u) => sum + (u.askSize ?? 0), 0);
  const bidTotal = units.reduce((sum, u) => sum + (u.bidSize ?? 0), 0);
  const total = askTotal + bidTotal || 1;

  const askRatio = (askTotal / total) * 100;
  const bidRatio = (bidTotal / total) * 100;

  return {
    askTotal,
    bidTotal,
    askRatio: Number(askRatio.toFixed(2)),
    bidRatio: Number(bidRatio.toFixed(2)),
  };
}

const emptyBalance: OrderbookBalance = {
  askTotal: 0,
  bidTotal: 0,
  askRatio: 50,
  bidRatio: 50,
};

export class OrderbookRowStore extends KeyedExternalStoreBase<number> {
  private readonly rowCount: number;

  private rows: OrderbookRow[];
  private balance: OrderbookBalance = emptyBalance;

  private balanceBus = new Bus();

  constructor(initial?: MarketOrderbook, rowCount = 60) {
    super();
    this.rowCount = rowCount;

    this.rows = Array.from({ length: rowCount }, () => ({ price: 0, size: 0, width: 0 }));

    if (initial?.units) {
      this.applyUnits(initial.units);
    }
  }

  // hooks에 사용
  subscribeBalance(listener: Listener) {
    return this.balanceBus.subscribe(listener);
  }

  getRow = (index: number) => this.rows[index];
  getBalance = () => this.balance;

  // sse에서 사용
  updateFromStream(orderbook: MarketOrderbook) {
    if (!orderbook.units) return;

    this.applyUnits(orderbook.units);
  }

  private applyUnits(units: MarketOrderbook['units']) {
    const nextRows = buildRows(units, this.rowCount);

    // 행 단위로 바뀐 인덱스만 notify함.
    for (let i = 0; i < this.rowCount; i++) {
      const prev = this.rows[i];
      const next = nextRows[i];

      if (
        prev.price !== next.price ||
        prev.size !== next.size ||
        prev.width !== next.width
      ) {
        this.rows[i] = next;
        this.notifyKey(i);
      }
    }

    const nextBalance = calcBalance(units);
    if (
      this.balance.askTotal !== nextBalance.askTotal ||
      this.balance.bidTotal !== nextBalance.bidTotal ||
      this.balance.askRatio !== nextBalance.askRatio ||
      this.balance.bidRatio !== nextBalance.bidRatio
    ) {
      this.balance = nextBalance;
      this.balanceBus.emit();
    }
  }
}
