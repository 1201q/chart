import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TradingFavorite } from '../entities/trading-favorite.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(TradingFavorite)
    private readonly favRepo: Repository<TradingFavorite>,
  ) {}

  async getMyFavorites(userId: string) {
    const rows = await this.favRepo.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });

    return { ok: true, markets: rows.map((r) => r.market) };
  }

  async toggle(userId: string, market: string) {
    const existing = await this.favRepo.findOne({
      where: { userId, market },
    });

    if (existing) {
      await this.favRepo.remove(existing);
      return { ok: true, isFavorite: false };
    }

    const entity = this.favRepo.create({ userId, market });
    await this.favRepo.save(entity);
    return { ok: true, isFavorite: true };
  }
}
