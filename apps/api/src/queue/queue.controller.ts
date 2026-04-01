import { Body, Controller, Get, Post } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import { UpbitMarket } from 'src/market/entities/upbit-market.entity';
import { QUEUE, JOB } from './queue.constants';
import { UpbitCandleTimeframeUrl } from '@chart/shared-types';

@Roles('ADMIN')
@Controller('queue')
export class QueueController {
  constructor(
    @InjectQueue(QUEUE.CANDLE_REFRESH)
    private readonly candleRefreshQueue: Queue,

    @InjectRepository(UpbitMarket)
    private readonly marketRepo: Repository<UpbitMarket>,
  ) {}

  @Get()
  async getMarkets() {
    return null;
  }

  /**
   * POST /queue/candle-refresh
   * body: { maxPages?: number }  기본값 10 (최대 2000일치 데이터 per 마켓/타임프레임)
   *
   * 전체 KRW 마켓 × ['days','weeks','months'] 일괄 갱신.
   * maxPages=1  → 최신 200개 (일별 cron과 동일)
   * maxPages=10 → 약 2000일 (5.5년치 일봉)
   * maxPages=50 → Upbit 전체 히스토리
   */
  @Public()
  @Post('candle-refresh')
  async triggerFullRefresh(@Body('maxPages') maxPages: number = 10) {
    const markets = await this.marketRepo.find({
      where: { marketCurrency: 'KRW', isActive: 1 },
    });

    console.log(maxPages);

    const TIMEFRAMES: UpbitCandleTimeframeUrl[] = ['days', 'weeks', 'months'];

    const jobs = markets.flatMap((m) =>
      TIMEFRAMES.map((tf) => ({
        name: JOB.REFRESH_MARKET_CANDLES,
        data: { market: m.marketCode, timeframeUrl: tf, maxPages },
        opts: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 10_000 },
        },
      })),
    );

    await this.candleRefreshQueue.addBulk(jobs);

    return {
      queued: jobs.length,
      markets: markets.length,
      timeframes: TIMEFRAMES.length,
      maxPages,
      estimatedRequests: jobs.length * maxPages,
      estimatedDurationSeconds: Math.ceil((jobs.length * maxPages) / 8),
    };
  }

  /**
   * GET /queue/candle-refresh/status
   * 현재 큐 상태 조회
   */
  @Public()
  @Get('candle-refresh/status')
  async getRefreshStatus() {
    const [waiting, active, failed, completed] = await Promise.all([
      this.candleRefreshQueue.getWaitingCount(),
      this.candleRefreshQueue.getActiveCount(),
      this.candleRefreshQueue.getFailedCount(),
      this.candleRefreshQueue.getCompletedCount(),
    ]);

    return { waiting, active, failed, completed };
  }
}
