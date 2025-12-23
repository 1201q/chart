import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TradingUser } from './entities/trading-user.entity';

@Injectable()
export class TradingTestService {
  private adminUserId: string | null = null;

  constructor(
    @InjectRepository(TradingUser)
    private readonly tradingUserRepo: Repository<TradingUser>,
  ) {}

  async getAdminUserId(): Promise<string> {
    if (this.adminUserId) return this.adminUserId;

    const admin = await this.tradingUserRepo.findOne({
      where: { username: 'admin' },
    });

    if (!admin) {
      throw new Error('Admin user not found');
    }

    this.adminUserId = admin.id;
    return admin.id;
  }
}
