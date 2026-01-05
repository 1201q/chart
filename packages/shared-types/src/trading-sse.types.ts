import { TradingFillWithOrderIdDto, TradingOrderDto } from './trading.types';

export type TradingSseEvent =
  | { type: 'snapshot'; data: TradingSnapshot }
  | { type: 'order'; data: TradingOrderDto }
  | { type: 'fill'; data: TradingFillWithOrderIdDto }
  | { type: 'balance'; data: TradingBalanceDto[] }
  | { type: 'position'; data: TradingPositionDto }
  | { type: 'heartbeat'; data: 'ping' };

export type TradingSnapshot = {
  time: string;
  balances: TradingBalanceDto[];
  positions: TradingPositionDto[];
  openOrders: TradingOrderDto[];
  recentFills: TradingFillWithOrderIdDto[];
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
