import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TradingTestService } from '../trading.test.service';

import { GetFillsQueryDto } from './fills.dto';
import { TradingFill } from '../entities/trading-fill.entity';

@Injectable()
export class FillsService {
  constructor(
    private readonly testService: TradingTestService,

    @InjectRepository(TradingFill)
    private readonly fillRepo: Repository<TradingFill>,
  ) {}

  async getMyFills(query: GetFillsQueryDto) {
    const userId = await this.testService.getAdminUserId();

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
