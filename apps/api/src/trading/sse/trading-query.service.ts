import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TradingBalance } from '../entities/trading-balance.entity';
import { Repository } from 'typeorm';
import { TradingPosition } from '../entities/trading-position.entity';
import { TradingOrder } from '../entities/trading-order.entity';
import { TradingFill } from '../entities/trading-fill.entity';
import { TradingSnapshot } from '@chart/shared-types';
import { mapBalance, mapFill, mapOrder, mapPosition } from './trading-sse.mappers';

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
      balances: balances.map(mapBalance),
      positions: positions.map(mapPosition),
      openOrders: openOrders.map(mapOrder),
      recentFills: recentFills.map(mapFill),
    };
  }
}
