import { Injectable } from '@nestjs/common';
import { TradingTestService } from '../trading.test.service';
import { InjectRepository } from '@nestjs/typeorm';
import { TradingPosition } from '../entities/trading-position.entity';
import { Repository } from 'typeorm';
import { mapPosition } from '../sse/trading-sse.mappers';

@Injectable()
export class PositionsService {
  constructor(
    private readonly testService: TradingTestService,

    @InjectRepository(TradingPosition)
    private readonly posRepo: Repository<TradingPosition>,
  ) {}

  async getMyPositions() {
    const userId = await this.testService.getAdminUserId();

    const rows = await this.posRepo.find({
      where: { userId },
    });

    const result = rows.map(mapPosition);

    return { ok: true, positions: result };
  }
}
