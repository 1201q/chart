import {
  TradingBalanceDto,
  TradingFillDto,
  TradingOrderDto,
  TradingPositionDto,
} from '@chart/shared-types';
import { TradingBalance } from '../entities/trading-balance.entity';
import { TradingPosition } from '../entities/trading-position.entity';
import { TradingOrder } from '../entities/trading-order.entity';
import { TradingFill } from '../entities/trading-fill.entity';

export function mapBalance(b: TradingBalance): TradingBalanceDto {
  return {
    currency: b.currency,
    available: b.available,
    locked: b.locked,
    updatedAt: b.updatedAt,
  };
}

export function mapPosition(p: TradingPosition): TradingPositionDto {
  return {
    market: p.market,
    assetSymbol: p.assetSymbol,
    qty: p.qty,
    avgPrice: p.avgPrice,
    cost: p.cost,
    realizedPnl: p.realizedPnl,
    updatedAt: p.updatedAt,
  };
}

export function mapOrder(o: TradingOrder): TradingOrderDto {
  return {
    id: o.id,
    market: o.market,
    side: o.side,
    type: o.type,
    price: o.price,
    qty: o.qty,
    filledQty: o.filledQty,
    remainingQty: o.remainingQty,
    status: o.status,
    reservedAmount: o.reservedAmount,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    canceledAt: o.canceledAt,
    filledAt: o.filledAt,
  };
}

export function mapFill(f: TradingFill): TradingFillDto {
  return {
    id: f.id,
    orderId: f.orderId,
    market: f.market,
    side: f.side,
    price: f.price,
    qty: f.qty,
    fee: f.fee,
    createdAt: f.createdAt,
  };
}
