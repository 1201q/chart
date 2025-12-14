import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';

import { Queue } from 'bullmq';
import { QUEUE, JOB } from './queue.constants';

@Injectable()
export class QueueProducer {
  constructor(
    @InjectQueue(QUEUE.MARKET_SYNC) private readonly marketQ: Queue,
    @InjectQueue(QUEUE.CMC_SYNC) private readonly cmcQ: Queue,
    @InjectQueue(QUEUE.CMC_TRANSLATE) private readonly translateQ: Queue,
    @InjectQueue(QUEUE.ICON_UPLOAD) private readonly iconQ: Queue,
  ) { }

  // 매일 마켓 갱신
  async ensureDailyMarketSync() {
    await this.marketQ.add(
      JOB.MARKET_DAILY,
      {},
      {
        jobId: 'market-daily',
        repeat: { pattern: '0 3 * * *', tz: 'Asia/Seoul' }, // 매일 오전 3시
      },
    );
  }

  async enqueueCmcInfoBatch(symbols: string[]) {
    await this.cmcQ.add(
      JOB.CMC_INFO_BATCH,
      { symbols },
      { jobId: `cmc-batch:${Date.now()}` },
    );
  }

  async enqueueTranslate(cmcId: number) {
    await this.translateQ.add(
      JOB.CMC_TRANSLATE_ONE,
      { cmcId },
      { jobId: `translate:${cmcId}` },
    );
  }

  async enqueueIconUpload(cmcId: number) {
    await this.iconQ.add(
      JOB.ICON_UPLOAD_ONE,
      { cmcId },
      { jobId: `icon-upload:${cmcId}` },
    );
  }
}
