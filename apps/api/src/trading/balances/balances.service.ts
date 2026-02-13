import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TradingBalance } from '../entities/trading-balance.entity';

import { SetBalanceBodyDto } from './balances.dto';

import Decimal from 'decimal.js-light';
import { mapBalance } from '../sse/trading-sse.mappers';

const SEED_KRW = '100000000'; // 1억

function D(v: string) {
  return new Decimal(v);
}

@Injectable()
export class BalancesService {
  constructor(
    private readonly ds: DataSource,

    @InjectRepository(TradingBalance)
    private readonly tradingBalanceRepo: Repository<TradingBalance>,
  ) {}

  async getMyBalances(userId: string) {

    const rows = await this.tradingBalanceRepo.find({
      where: { userId },
      order: { currency: 'ASC' },
    });

    const result = rows.map(mapBalance);
    return { ok: true, balances: result };
  }

  async setBalance(dto: SetBalanceBodyDto, userId: string) {

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

  async resetBalances(userId: string) {

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
