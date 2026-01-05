export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'LIMIT';
export type OrderStatus = 'OPEN' | 'FILLED' | 'CANCELED';

export interface TradingOrderDto {
  id: string;
  market: string;
  side: OrderSide;
  type: OrderType;
  price: string;
  qty: string;
  filledQty: string;
  remainingQty: string;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  canceledAt: Date;
  filledAt: Date;
}

export interface TradingFillDto {
  id: string;
  market: string;
  price: string;
  side: OrderSide;
  qty: string;
  fee: string;
  createdAt: Date;
}

export interface TradingFillWithOrderIdDto extends TradingFillDto {
  orderId: string;
}
