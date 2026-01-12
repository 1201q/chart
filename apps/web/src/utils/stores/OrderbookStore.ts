'use client';

import { useEffect, useRef, useState } from 'react';
import { MarketOrderbook } from '@chart/shared-types';

export type OrderbookRow = {
  price: number;
  size: number;
  width: number;
};

export type OrderbookBalance = {
  askTotal: number;
  bidTotal: number;
  askRatio: number; // 0~100
  bidRatio: number; // 0~100
};

type Listener = () => void;

function buildOrderbookRows(
  units: MarketOrderbook['units'],
  rowCount = 60,
): OrderbookRow[] {
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

function calcOrderbookBalance(units: MarketOrderbook['units']): OrderbookBalance {
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

export class OrderbookStore {
  private rows: OrderbookRow[] | null = null;
  private balance: OrderbookBalance | null = null;

  private rowListeners = new Set<Listener>();
  private balanceListeners = new Set<Listener>();

  constructor(initialSnapshot?: MarketOrderbook) {
    if (initialSnapshot?.units) {
      this.rows = buildOrderbookRows(initialSnapshot.units);
      this.balance = calcOrderbookBalance(initialSnapshot.units);
    }
  }

  subscribeRows(listener: Listener) {
    this.rowListeners.add(listener);
    return () => this.rowListeners.delete(listener);
  }

  subscribeBalance(listener: Listener) {
    this.balanceListeners.add(listener);
    return () => this.balanceListeners.delete(listener);
  }

  getRowsSnapshot = () => this.rows;
  getBalanceSnapshot = () => this.balance;
}
