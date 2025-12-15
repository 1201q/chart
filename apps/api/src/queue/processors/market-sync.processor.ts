import { Processor, WorkerHost } from '@nestjs/bullmq';
import { JOB, QUEUE } from '../queue.constants';
import { Logger } from '@nestjs/common';
import { MarketSyncService } from 'src/market/market.sync.service';
import { QueueProducer } from '../queue.producer';
import { Job } from 'bullmq';
import { MarketService } from 'src/market/market.service';

@Processor(QUEUE.MARKET_SYNC, { concurrency: 1 })
export class MarketSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(MarketSyncProcessor.name);

  constructor(
    private readonly marketSyncService: MarketSyncService,
    private readonly marketService: MarketService,
    private readonly producer: QueueProducer,
  ) {
    super();
  }

  // 오전 3시에 처리함.
  async process(job: Job) {
    if (job.name !== JOB.MARKET_DAILY) return;

    this.logger.log('🔄 마켓 싱크를 시작합니다.');
  }
}
