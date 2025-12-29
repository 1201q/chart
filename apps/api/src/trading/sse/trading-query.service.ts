import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TradingBalance } from '../entities/trading-balance.entity';
import { Repository } from 'typeorm';
import { TradingPosition } from '../entities/trading-position.entity';
import { TradingOrder } from '../entities/trading-order.entity';
import { TradingFill } from '../entities/trading-fill.entity';
import {
  TradingBalanceDto,
  TradingFillDto,
  TradingOrderDto,
  TradingPositionDto,
  TradingSnapshot,
} from '@chart/shared-types';

@Injectable()
export class TradingQueryService {
  constructor(
    @InjectRepository(TradingBalance)
    private readonly balRepo: Repository<TradingBalance>,

    @InjectRepository(TradingPosition)
    private readonly posRepo: Repository<TradingPosition>,

    @InjectRepository(TradingOrder)
    private readonly orderRepo: Repository<TradingOrder>,

    @InjectRepository(TradingFill)
    private readonly fillRepo: Repository<TradingFill>,
  ) {}

  async buildSnapshot(userId: string): Promise<TradingSnapshot> {
    const [balances, positions, openOrders, recentFills] = await Promise.all([
      this.balRepo.find({ where: { userId }, order: { currency: 'ASC' } }),
      this.posRepo.find({ where: { userId }, order: { market: 'ASC' } }),
      this.orderRepo.find({
        where: { userId, status: 'OPEN' },
        order: { createdAt: 'DESC' },
        take: 200,
      }),
      this.fillRepo.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: 100,
      }),
    ]);

    return {
      time: new Date().toISOString(),
      balances: balances.map(this.mapBalances),
      positions: positions.map(this.mapPosition),
      openOrders: openOrders.map(this.mapOrder),
      recentFills: recentFills.map(this.mapFill),
    };
  }

  mapBalances(b: TradingBalance): TradingBalanceDto {
    return {
      currency: b.currency,
      available: b.available,
      locked: b.locked,
      updatedAt: b.updatedAt,
    };
  }

  mapPosition(p: TradingPosition): TradingPositionDto {
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

  mapOrder(o: TradingOrder): TradingOrderDto {
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

  mapFill(f: TradingFill): TradingFillDto {
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
}
