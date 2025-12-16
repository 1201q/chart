import { Injectable, Logger } from '@nestjs/common';
import { CmcInfoService } from './cmc-info.service';

import { InjectRepository } from '@nestjs/typeorm';
import { UpbitMarket } from 'src/market/entities/upbit-market.entity';
import { In, Repository } from 'typeorm';
import { CoinInfo } from 'src/market/entities/coin-info.entity';
import { CmcInfoItem, CmcInfoResponse, CmcInfoResponseById } from './cmc-info.types';

@Injectable()
export class CmcInfoSyncService {
  private readonly logger = new Logger(CmcInfoSyncService.name);

  constructor(
    private readonly cmcInfoService: CmcInfoService,

    @InjectRepository(UpbitMarket)
    private readonly upbitMarketRepo: Repository<UpbitMarket>,

    @InjectRepository(CoinInfo)
    private readonly coinInfoRepo: Repository<CoinInfo>,
  ) {}

  async syncAll() {
    const markets = await this.upbitMarketRepo.find({
      where: { isActive: 1, marketCurrency: 'KRW' },
    });

    // 1. 존재하는 coinInfo 조회
    const existingCoinInfos = await this.coinInfoRepo.find({
      where: { upbitMarketId: In(markets.map((m) => m.id)) },
    });

    const coinInfoByMarketId = new Map<number, CoinInfo>();
    for (const ci of existingCoinInfos) {
      coinInfoByMarketId.set(ci.upbitMarketId, ci);
    }

    // 2. coinInfo가 없는 마켓을 추림.
    const missing = markets.filter((m) => coinInfoByMarketId.has(m.id) === false);

    // 3. cmcid를 찾는 과정
    let createdCount = 0;

    if (missing.length > 0) {
      const symbols = this.cmcInfoService.extractUniqueSymbols(missing);

      const res = await this.cmcInfoService.fetchBySymbols(symbols);

      const json: CmcInfoResponse = await res.json();
      const data = json.data;

      for (const m of missing) {
        // 존재하면 continue
        if (coinInfoByMarketId.has(m.id)) continue;

        const find = this.cmcInfoService.findCmcIdForMarket(m, data);

        if (!find) {
          continue;
        }

        const { requestSymbol, cmcId } = find;

        try {
          const entity = this.coinInfoRepo.create({
            upbitMarketId: m.id,
            cmcId,
            requestSymbol,
            logoUrl: null,
            iconObjectKey: null,
            iconPublicUrl: null,
            descriptionEn: null,
            descriptionKo: null,
            lastCmcSyncedAt: null,
          });

          const saved = await this.coinInfoRepo.save(entity);
          coinInfoByMarketId.set(m.id, saved);
          createdCount += 1;
        } catch (error) {
          this.logger.error(
            `COIN_INFO 생성 실패: ${m.id} / ${m.marketCode} / ${m.assetSymbol}`,
            error,
          );
        }
      }
    }

    // 4. cmcId 있는 애들을 모두 모읍니다.
    const allCoinInfos = Array.from(coinInfoByMarketId.values()).filter(
      (ci) => ci.cmcId && ci.cmcId > 0,
    );
    const ids = Array.from(new Set(allCoinInfos.map((ci) => ci.cmcId)));

    let updatedCount = 0;

    const res2 = await this.cmcInfoService.fetchByIds(ids);
    const json2 = (await res2.json()) as CmcInfoResponseById;
    const dataById = json2.data;

    // 5. coinInfo 업데이트
    for (const ci of allCoinInfos) {
      const item = dataById[String(ci.cmcId)];
      if (!item) continue;

      const changed = this.isChangedCoinInfo(ci, item);

      if (changed) {
        await this.coinInfoRepo.save(ci);
        updatedCount += 1;
      }
    }

    return { created: createdCount, updated: updatedCount };
  }

  private isChangedCoinInfo(prev: CoinInfo, update: CmcInfoItem): boolean {
    let changed = false;

    const newLogoUrl = update.logo ?? null;
    const newDesc = update.description ?? null;

    if (prev.logoUrl !== newLogoUrl) {
      prev.logoUrl = newLogoUrl;
      changed = true;
    }

    if (prev.descriptionEn !== newDesc) {
      prev.descriptionEn = newDesc;
      changed = true;
    }

    const now = new Date();
    prev.lastCmcSyncedAt = now;

    return changed;
  }
}
