import {
  TradingBalanceDto,
  TradingFillDto,
  TradingFillWithOrderIdDto,
  TradingOrderDto,
  TradingPositionDto,
} from '@chart/shared-types';
import { TradingBalance } from '../entities/trading-balance.entity';
import { TradingPosition } from '../entities/trading-position.entity';
import { TradingOrder } from '../entities/trading-order.entity';
import { TradingFill } from '../entities/trading-fill.entity';
import { formatDecimal } from '../../common/helpers/decimal';

export function mapBalance(b: TradingBalance): TradingBalanceDto {
  return {
    currency: b.currency,
    available: formatDecimal(b.available),
    locked: formatDecimal(b.locked),
    updatedAt: b.updatedAt,
  };
}

export function mapPosition(p: TradingPosition): TradingPositionDto {
  return {
    market: p.market,
    assetSymbol: p.assetSymbol,
    qty: formatDecimal(p.qty),
    avgPrice: formatDecimal(p.avgPrice),
    cost: formatDecimal(p.cost),
    realizedPnl: formatDecimal(p.realizedPnl),
    updatedAt: p.updatedAt,
  };
}

export function mapOrder(o: TradingOrder): TradingOrderDto {
  return {
    id: o.id,
    market: o.market,
    side: o.side,
    type: o.type,
    price: formatDecimal(o.price),
    qty: formatDecimal(o.qty),
    filledQty: formatDecimal(o.filledQty),
    remainingQty: formatDecimal(o.remainingQty),
    status: o.status,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    canceledAt: o.canceledAt,
    filledAt: o.filledAt,
  };
}

export function mapFill(f: TradingFill): TradingFillDto {
  return {
    id: f.id,
    market: f.market,
    side: f.side,
    price: formatDecimal(f.price),
    qty: formatDecimal(f.qty),
    fee: formatDecimal(f.fee),
    createdAt: f.createdAt,
  };
}

export function mapFillWithOrderId(f: TradingFill): TradingFillWithOrderIdDto {
  return {
    id: f.id,
    orderId: f.orderId,
    market: f.market,
    side: f.side,
    price: formatDecimal(f.price),
    qty: formatDecimal(f.qty),
    fee: formatDecimal(f.fee),
    createdAt: f.createdAt,
  };
}
