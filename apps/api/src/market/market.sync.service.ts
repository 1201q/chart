import { MarketDiff, MarketInfo } from '@chart/shared-types';
import { Injectable, Logger } from '@nestjs/common';

import { UpbitHttpService } from 'src/upbit/upbit.http.service';
import { MarketService } from './market.service';
import { InjectRepository } from '@nestjs/typeorm';
import { UpbitMarket } from './entities/upbit-market.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class MarketSyncService {
  private readonly logger = new Logger(MarketSyncService.name);

  constructor(
    private readonly upbitHttpService: UpbitHttpService,
    private readonly marketService: MarketService,

    @InjectRepository(UpbitMarket)
    private readonly upbitMarketRepo: Repository<UpbitMarket>,
  ) { }

  /**
   * upbit에서 마켓 리스트를 가져와서 캐시 갱신.
   */
  async syncMarket() {
    const raw = await this.upbitHttpService.getAllmarkets();
    const formatted = this.marketService.formatUpbitMarketInfo(raw);

    // KRW 마켓만 필터링
    const krw = formatted.filter((m) => m.baseCurrency === 'KRW');

    // 이전 데이터 krw
    const prev = this.marketService.getAll();
    const diff = this.marketService.calcMarketDiff(prev, krw);

    if (diff.added.length > 0 || diff.removed.length > 0) {
      this.logger.verbose(
        `✅ added: ${diff.added.length}, removed: ${diff.removed.length}`,
      );
    } else {
      this.logger.log('✅ market sync: 변경사항 없음');
    }

    await this.upsertDiffToDb(diff, krw);
  }

  private async upsertDiffToDb(diff: MarketDiff, all: MarketInfo[]) {
    // 1. 추가됨. => DB에 insert
    for (const added of diff.added) {
      const entity = this.upbitMarketRepo.create({
        marketCode: added.code,
        baseCurrency: added.baseCurrency,
        quoteCurrency: added.quoteCurrency,
        koreanName: added.koreanName,
        englishName: added.englishName,
        isActive: 1,
      });

      await this.upbitMarketRepo.save(entity);

      this.logger.log(`➕ 코인 추가: ${added.code}`);
    }

    // 2. 제거됨. => 거래중지
    if (diff.removed.length > 0) {
      const removedCodes = diff.removed.map((m) => m.code);

      await this.upbitMarketRepo.update(
        { marketCode: In(removedCodes) },
        { isActive: 0, updatedAt: new Date() },
      );

      this.logger.log(`⛔ 거래 중지 처리: ${removedCodes.join(', ')}`);
    }

    // 3. 동기화 => 전체 마켓 갱신
    await this.syncExistingMarkets(all);
  }

  private async syncExistingMarkets(all: MarketInfo[]) {
    const codes = all.map((m) => m.code);
    if (codes.length === 0) return;

    const existingMarkets = await this.upbitMarketRepo.find({
      where: { marketCode: In(codes) },
    });

    const existingMap = new Map(existingMarkets.map((m) => [m.marketCode, m]));

    for (const item of all) {
      const target = existingMap.get(item.code);

      if (!target) continue;

      let changed = false;

      if (target.koreanName !== item.koreanName) {
        target.koreanName = item.koreanName;
        changed = true;
      }
      if (target.englishName !== item.englishName) {
        target.englishName = item.englishName;
        changed = true;
      }
      if (target.baseCurrency !== item.baseCurrency) {
        target.baseCurrency = item.baseCurrency;
        changed = true;
      }
      if (target.quoteCurrency !== item.quoteCurrency) {
        target.quoteCurrency = item.quoteCurrency;
        changed = true;
      }
      if (target.isActive === 0) {
        target.isActive = 1;
        changed = true;
      }

      if (changed) {
        target.updatedAt = new Date();
        await this.upbitMarketRepo.save(target);
        this.logger.log(`🔄 코인 정보 갱신: ${item.code}`);
      }
    }
  }
}
