import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';

import { Queue } from 'bullmq';
import { QUEUE, JOB } from './queue.constants';

@Injectable()
export class QueueProducer {
  constructor(
    @InjectQueue(QUEUE.CMC_TRANSLATE) private readonly translateQ: Queue,
    @InjectQueue(QUEUE.ICON_UPLOAD) private readonly iconQ: Queue,
  ) {}

  async enqueueTranslate(cmcId: number) {
    await this.translateQ.add(
      JOB.CMC_TRANSLATE_ONE,
      { cmcId },
      { jobId: `translate-${cmcId}` },
    );
  }

  async enqueueIconUpload(cmcId: number) {
    await this.iconQ.add(
      JOB.ICON_UPLOAD_ONE,
      { cmcId },
      { jobId: `icon-upload-${cmcId}` },
    );
  }
}
