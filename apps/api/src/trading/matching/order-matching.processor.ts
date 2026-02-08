import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { QUEUE, JOB } from 'src/queue/queue.constants';
import { MatchingService } from './matching.service';
import { ActiveMarketService } from './active-market.service';
import { IOrderbookProvider } from './providers/orderbook-provider.interface';
import { TradingOrder } from '../entities/trading-order.entity';

@Processor(QUEUE.ORDER_MATCHING, { concurrency: 1 })
@Injectable()
export class OrderMatchingProcessor extends WorkerHost {
  private readonly logger = new Logger(OrderMatchingProcessor.name);

  constructor(
    private readonly matching: MatchingService,
    private readonly activeMarkets: ActiveMarketService,

    @Inject('ORDERBOOK_PROVIDER')
    private readonly orderbooks: IOrderbookProvider,

    @InjectRepository(TradingOrder)
    private readonly orderRepo: Repository<TradingOrder>,
  ) {
    super();
  }

  async process(job: Job) {
    if (job.name !== JOB.MATCH_ACTIVE_MARKETS) return;

    const markets = this.activeMarkets.getActiveMarkets();

    if (markets.length === 0) {
      return { processed: 0 };
    }

    this.logger.debug(`🔄 Matching ${markets.length} active markets`);

    const startTime = Date.now();
    let totalMatched = 0;
    let totalFills = 0;

    for (const market of markets) {
      try {
        const result = await this.matchSingleMarket(market);
        totalMatched += result.matched;
        totalFills += result.fills;
      } catch (error) {
        this.logger.error(`❌ Failed to match ${market}: ${error.message}`, error.stack);
      }
    }

    const elapsed = Date.now() - startTime;
    if (totalFills > 0) {
      this.logger.log(
        `✅ Matched ${totalMatched} orders, ${totalFills} fills in ${elapsed}ms`,
      );
    }

    return { processed: markets.length, matched: totalMatched, fills: totalFills };
  }

  private async matchSingleMarket(market: string) {
    // 1. 호가 조회
    const orderbook = this.orderbooks.getSnapshotByCode(market);

    if (!orderbook) {
      this.logger.warn(`⚠️ No orderbook for ${market}`);
      return { matched: 0, fills: 0 };
    }

    // 2. 체결 시도
    const result = await this.matching.matchMarket(orderbook, { maxOrders: 50 });

    // 3. 해당 마켓에 OPEN 주문이 더 있는지 확인
    const openCount = await this.orderRepo.count({
      where: { market, status: 'OPEN' },
    });

    // 4. OPEN 주문이 없으면 Active Set에서 제거
    if (openCount === 0) {
      this.activeMarkets.remove(market);
      this.logger.debug(`✅ ${market} completed - removed from active`);
    }

    return { matched: result.matchedOrders, fills: result.fills };
  }
}
