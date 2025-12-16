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
  }
}
