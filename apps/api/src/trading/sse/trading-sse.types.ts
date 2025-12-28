export type TradingSseEvent =
  | { type: 'snapshot'; data: TradingSnapshot }
  | { type: 'order'; data: TradingOrderDto }
  | { type: 'fill'; data: TradingFillDto }
  | { type: 'balance'; data: TradingBalanceDto[] }
  | { type: 'position'; data: TradingPositionDto }
  | { type: 'heartbeat'; data: 'ping' };

export type TradingSnapshot = {
  time: string;
  balances: TradingBalanceDto[];
  positions: TradingPositionDto[];
  openOrders: TradingOrderDto[];
  recentFills: TradingFillDto[];
};

export type TradingBalanceDto = {
  currency: string;
  available: string;
  locked: string;
  updatedAt: Date;
};

export type TradingPositionDto = {
  market: string;
  assetSymbol: string;
  qty: string;
  avgPrice: string;
  cost: string;
  realizedPnl: string;
  updatedAt: Date;
};

export type TradingOrderDto = {
  id: string;
  market: string;
  side: 'BUY' | 'SELL';
  type: 'LIMIT';
  price: string;
  qty: string;
  filledQty: string;
  remainingQty: string;
  status: 'OPEN' | 'FILLED' | 'CANCELED';
  reservedAmount: string | null;
  createdAt: Date;
  updatedAt: Date;
  canceledAt: Date | null;
  filledAt: Date | null;
};

export type TradingFillDto = {
  id: string;
  orderId: string;
  market: string;
  side: 'BUY' | 'SELL';
  price: string;
  qty: string;
  fee: string;
  createdAt: Date;
};
