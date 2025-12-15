import { Processor, WorkerHost } from '@nestjs/bullmq';
import { JOB, QUEUE } from '../queue.constants';
import { Logger } from '@nestjs/common';

import { QueueProducer } from '../queue.producer';
import { Job } from 'bullmq';
import { CmcInfoService } from 'src/cmc/cmc-info.service';
import { InjectRepository } from '@nestjs/typeorm';
import { UpbitMarket } from 'src/market/entities/upbit-market.entity';
import { Repository } from 'typeorm';

@Processor(QUEUE.CMC_SYNC, { concurrency: 1 })
export class CmcSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(CmcSyncProcessor.name);

  constructor(
    private readonly cmcInfoService: CmcInfoService,
    private readonly producer: QueueProducer,

    @InjectRepository(UpbitMarket)
    private readonly upbitMarketRepo: Repository<UpbitMarket>,
  ) {
    super();
  }

  async process(job: Job) {
    if (job.name !== JOB.CMC_INFO_BATCH) return;

    this.logger.log(`🚀 cmc-sync start (reason=${job.data?.reason ?? 'n/a'})`);

    const markets = await this.upbitMarketRepo.find({
      where: { isActive: 1, baseCurrency: 'KRW' },
    });

    if (markets.length === 0) {
      this.logger.warn('❌ cmc-sync aborted: no active markets found');
      return;
    }

    const primary = Array.from(
      new Set(markets.map((m) => m.quoteCurrency?.toUpperCase()).filter(Boolean)),
    );

    // primary, sub로 구성
    const subMap = new Map<string, string>();

    for (const m of markets) {
      const p = m.quoteCurrency?.toUpperCase();
      const s = m.subQuoteCurrency?.toUpperCase();

      if (p && s && p !== s) subMap.set(p, s);
    }

    // 결과
    const collected: Record<string, any> = {};

    // 실패한 코드들
    const invalidAll = new Set<string>();

    // 1. primary로 먼저 처리
    const { data, invalid } = await this.cmcInfoService.fetchInfoBatch(primary);

    Object.assign(collected, data);
    invalid.forEach((s) => invalidAll.add(s));

    // 2. invalid 중 sub가 있는경우 다시 그걸로 재시도
    const subSymbols = Array.from(
      new Set(
        Array.from(invalidAll)
          .map((s) => subMap.get(s))
          .filter((s): s is string => !!s),
      ),
    );

    if (subSymbols.length > 0) {
      this.logger.log(`🔄 retry with sub symbols: ${subSymbols.join(', ')}`);

      const { data } = await this.cmcInfoService.fetchInfoBatch(subSymbols);

      Object.assign(collected, data);
    }

    // 3. 최종 결과 처리
  }
}
