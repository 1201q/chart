import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { QUEUE, JOB } from 'src/queue/queue.constants';
import { TradingOrder } from '../entities/trading-order.entity';
import { ActiveMarketService } from './active-market.service';

@Injectable()
export class OrderMatchingBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(OrderMatchingBootstrapService.name);

  constructor(
    @InjectQueue(QUEUE.ORDER_MATCHING)
    private readonly queue: Queue,

    @InjectRepository(TradingOrder)
    private readonly orderRepo: Repository<TradingOrder>,

    private readonly activeMarkets: ActiveMarketService,
  ) {}

  async onModuleInit() {
    // 1. 기존 Repeatable Job 정리
    await this.cleanupOldJobs();

    // 2. DB에서 OPEN 주문이 있는 마켓 복구
    await this.restoreActiveMarkets();

    // 3. Repeatable Job 등록 (1초마다)
    await this.registerRepeatableJob();

    this.logger.log('🚀 Order matching bootstrap completed');
  }

  private async cleanupOldJobs() {
    const repeatableJobs = await this.queue.getJobSchedulers();

    for (const job of repeatableJobs) {
      if (job.name === JOB.MATCH_ACTIVE_MARKETS) {
        await this.queue.removeJobScheduler(job.key);
        this.logger.debug(`🗑️ Removed old repeatable job: ${job.key}`);
      }
    }
  }

  private async restoreActiveMarkets() {
    // OPEN 주문이 있는 마켓 목록 조회
    const markets = await this.orderRepo
      .createQueryBuilder('o')
      .select('DISTINCT o.market', 'market')
      .where('o.status = :status', { status: 'OPEN' })
      .getRawMany<{ market: string }>();

    for (const { market } of markets) {
      this.activeMarkets.add(market);
    }

    if (markets.length > 0) {
      this.logger.log(`📋 Restored ${markets.length} active markets from DB`);
    }
  }

  private async registerRepeatableJob() {
    await this.queue.add(
      JOB.MATCH_ACTIVE_MARKETS,
      {}, // payload 없음
      {
        repeat: { every: 1000 }, // 1초마다
        removeOnComplete: true,
        removeOnFail: true,
      },
    );

    this.logger.log('⏰ Repeatable job registered (every 1s)');
  }
}
