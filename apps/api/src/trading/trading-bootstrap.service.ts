import { Injectable, OnModuleInit } from '@nestjs/common';

import { DataSource, Repository } from 'typeorm';
import { TradingUser } from './entities/trading-user.entity';
import { TradingBalance } from './entities/trading-balance.entity';

const SEED_KRW = '100000000';

@Injectable()
export class TradingBootstrapService implements OnModuleInit {
  constructor(private readonly ds: DataSource) {}

  async onModuleInit() {
    await this.ds.transaction(async (manager) => {
      const userRepo = manager.getRepository(TradingUser);
      const balanceRepo = manager.getRepository(TradingBalance);

      let admin = await userRepo.findOne({ where: { username: 'admin' } });

      if (!admin) {
        admin = userRepo.create({ username: 'admin' });
        await userRepo.save(admin);
      }

      await this.ensureBalanceRow(balanceRepo, admin.id, 'KRW', SEED_KRW);
    });
  }

  private async ensureBalanceRow(
    balRepo: Repository<TradingBalance>,
    userId: string,
    currency: string,
    available: string,
  ) {
    const existing = await balRepo.findOne({ where: { userId, currency } });
    if (existing) return;

    const row = balRepo.create({
      userId,
      currency,
      available,
      locked: '0',
    });

    await balRepo.save(row);
  }
}
