import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TradingBalance } from '../entities/trading-balance.entity';

import { SetBalanceDto } from './balances.dto';
import { TradingTestService } from '../trading.test.service';

import Decimal from 'decimal.js-light';

const SEED_KRW = '100000000';

function D(v: string) {
  return new Decimal(v);
}

@Injectable()
export class BalancesService {
  constructor(
    private readonly ds: DataSource,

    private readonly testService: TradingTestService,

    @InjectRepository(TradingBalance)
    private readonly tradingBalanceRepo: Repository<TradingBalance>,
  ) {}

  async getMyBalances() {
    const userId = await this.testService.getAdminUserId();

    return this.tradingBalanceRepo.find({
      where: { userId },
      order: { currency: 'ASC' },
    });
  }

  async setBalance(dto: SetBalanceDto) {
    const userId = await this.testService.getAdminUserId();

    if (D(dto.available).lt(0) || D(dto.locked).lt(0)) {
      throw new BadRequestException('Available and locked amounts must be non-negative');
    }

    await this.ds.transaction(async (manager) => {
      const repo = manager.getRepository(TradingBalance);

      const existing = await repo.findOne({
        where: { userId, currency: dto.currency },
        lock: { mode: 'pessimistic_write' },
      });

      if (existing) {
        existing.available = dto.available;
        existing.locked = dto.locked;
        await repo.save(existing);
      } else {
        await repo.save(
          repo.create({
            userId,
            currency: dto.currency,
            available: dto.available,
            locked: dto.locked,
          }),
        );
      }
    });

    return { ok: true };
  }

  async resetBalances() {
    const userId = await this.testService.getAdminUserId();

    await this.ds.transaction(async (manager) => {
      const repo = manager.getRepository(TradingBalance);

      const rows = await repo.find({
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });

      for (const r of rows) {
        r.available = '0';
        r.locked = '0';
      }

      if (rows.length) await repo.save(rows);

      for (const s of ['KRW']) {
        const row = await repo.findOne({
          where: { userId, currency: s },
          lock: { mode: 'pessimistic_write' },
        });

        if (row) {
          row.available = SEED_KRW;
          row.locked = '0';
          await repo.save(row);
        } else {
          await repo.save(
            repo.create({
              userId,
              currency: s,
              available: SEED_KRW,
              locked: '0',
            }),
          );
        }
      }
    });

    return { ok: true };
  }
}
