import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GetFillsQueryDto } from './fills.dto';
import { TradingFill } from '../entities/trading-fill.entity';

@Injectable()
export class FillsService {
  constructor(
    @InjectRepository(TradingFill)
    private readonly fillRepo: Repository<TradingFill>,
  ) {}

  async getMyFills(query: GetFillsQueryDto, userId: string) {
    const { market, orderId } = query;

    const rows = await this.fillRepo.find({
      where: {
        userId,
        ...(market ? { market: market.toUpperCase() } : {}),
        ...(orderId ? { orderId } : {}),
      },
      order: { createdAt: 'DESC' },
      take: 500,
    });

    return { ok: true, fills: rows };
  }
}
