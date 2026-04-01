import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE, JOB } from '../queue.constants';
import { CandlesService } from 'src/candles/candles.service';
import { UpbitCandleTimeframeUrl } from '@chart/shared-types';

interface RefreshMarketCandlesJobData {
  market: string;
  timeframeUrl: UpbitCandleTimeframeUrl;
  maxPages: number;
}

@Processor(QUEUE.CANDLE_REFRESH, {
  concurrency: 1, // UpbitRateLimiter가 HTTP 레벨에서 10/sec 보장
})
export class CandleRefreshProcessor extends WorkerHost {
  private readonly logger = new Logger(CandleRefreshProcessor.name);

  constructor(private readonly candlesService: CandlesService) {
    super();
  }

  async process(job: Job<RefreshMarketCandlesJobData>): Promise<void> {
    if (job.name !== JOB.REFRESH_MARKET_CANDLES) return;

    const { market, timeframeUrl, maxPages } = job.data;

    this.logger.verbose(`🕯️ Refreshing ${market}/${timeframeUrl} (maxPages=${maxPages})`);

    try {
      await this.candlesService.refreshMarketCandles(market, timeframeUrl, maxPages);
      this.logger.verbose(`✅ Refresh done: ${market}/${timeframeUrl}`);
    } catch (error) {
      this.logger.error(`❌ Refresh failed: ${market}/${timeframeUrl}`, error);
      throw error; // BullMQ가 재시도 처리
    }
  }
}
