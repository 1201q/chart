import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE, JOB } from 'src/queue/queue.constants';
import { UpbitHttpService } from 'src/upbit/upbit.http.service';
import { CandleVolumeTracker } from './candle-volume-tracker.service';

interface InitMarketJobData {
  market: string;
  count: number;
}

@Processor(QUEUE.CANDLE_INIT, {
  concurrency: 5, // 5개 동시 처리 (안전하게 감소)
  limiter: {
    max: 8, // 1초에 최대 8개 시작 (여유 확보)
    duration: 1000,
  },
})
export class CandleInitProcessor extends WorkerHost {
  private readonly logger = new Logger(CandleInitProcessor.name);

  constructor(
    private readonly upbitHttp: UpbitHttpService,
    private readonly candleVolumeTracker: CandleVolumeTracker,
  ) {
    super();
  }

  async process(job: Job<InitMarketJobData>): Promise<any> {
    const { market, count } = job.data;

    try {
      this.logger.verbose(`🔄 Initializing ${market} (${count} candles)...`);

      // REST API로 240분봉 조회
      const candles = await this.upbitHttp.getCandles(market, '240m', count);

      if (candles.length === 0) {
        this.logger.verbose(`⚠️ No candle data for ${market}`);
        return { market, candlesCount: 0, status: 'skipped' };
      }

      // CandleVolumeTracker에 저장 요청
      await this.candleVolumeTracker.saveMarketCandles(market, candles);

      this.logger.verbose(`✅ Initialized ${market}: ${candles.length} candles`);

      return {
        market,
        candlesCount: candles.length,
        status: 'success',
      };
    } catch (error) {
      this.logger.error(`❌ Failed to initialize ${market}`, error.message);
      throw error; // BullMQ가 재시도 처리
    }
  }
}
