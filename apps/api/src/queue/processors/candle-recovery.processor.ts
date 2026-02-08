import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE } from '../queue.constants';
import { CandleVolumeTracker } from 'src/realtime/candle/candle-volume-tracker.service';

interface RecoveryCandlesJobData {
  market: string;
  lastTime: string;
  currentTime: string;
}

/**
 * 캔들 복구 Worker
 *
 * 스냅샷 처리 시 누락된 봉을 순차적으로 복구
 * - Rate Limit 준수
 * - DB 부하 분산
 * - 자동 재시도
 */
@Processor(QUEUE.CANDLE_RECOVERY)
export class CandleRecoveryProcessor extends WorkerHost {
  private readonly logger = new Logger(CandleRecoveryProcessor.name);

  constructor(private readonly tracker: CandleVolumeTracker) {
    super();
  }

  async process(job: Job<RecoveryCandlesJobData>): Promise<void> {
    const { market, lastTime, currentTime } = job.data;

    this.logger.log(`🔄 Processing recovery for ${market}: ${lastTime} → ${currentTime}`);

    try {
      await this.tracker.recoverMissingCandles(market, lastTime, currentTime);

      this.logger.log(`✅ Recovery completed for ${market}`);
    } catch (error) {
      this.logger.error(`❌ Recovery failed for ${market}`, error);
      throw error; // BullMQ가 재시도 처리
    }
  }
}
