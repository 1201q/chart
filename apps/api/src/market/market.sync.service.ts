import { MarketDiff } from '@chart/shared-types';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { UpbitHttpService } from 'src/upbit/upbit.http.service';
import { MarketService } from './market.service';

@Injectable()
export class MarketSyncService {
  private readonly logger = new Logger(MarketSyncService.name);

  constructor(
    private readonly upbitHttpService: UpbitHttpService,
    private readonly marketService: MarketService,
  ) {}

  /**
   * upbit에서 마켓 리스트를 가져와서 캐시 갱신. diff 반환
   */
  async syncMarket(): Promise<MarketDiff> {
    this.logger.debug('syncMarket started');

    const raw = await this.upbitHttpService.getAllmarkets();
    const formatted = this.marketService.formatUpbitMarketInfo(raw);

    const prev = this.marketService.getAll();
    const diff = this.marketService.calcMarketDiff(prev, formatted);

    if (diff.added.length > 0 || diff.removed.length > 0) {
      this.logger.debug(
        `Markets added: ${diff.added.length}, removed: ${diff.removed.length}`,
      );
    } else {
      this.logger.debug('No market changes detected');
    }

    this.marketService.setAll(formatted);

    return diff;
  }

  @Cron('*/5 * * * *') // 5분마다 실행
  async handleCron() {
    await this.syncMarket();
  }
}
