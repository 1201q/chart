import { MarketDiff } from '@chart/shared-types';
import { Injectable, Logger } from '@nestjs/common';
// import { Cron } from '@nestjs/schedule';
import { UpbitHttpService } from 'src/upbit/upbit.http.service';
import { MarketService } from './market.service';

@Injectable()
export class MarketSyncService {
  private readonly logger = new Logger(MarketSyncService.name);

  constructor(
    private readonly upbitHttpService: UpbitHttpService,
    private readonly marketService: MarketService,
  ) { }

  /**
   * upbit에서 마켓 리스트를 가져와서 캐시 갱신. diff 반환
   */
  async syncMarket(): Promise<MarketDiff> {
    const raw = await this.upbitHttpService.getAllmarkets();
    const formatted = this.marketService.formatUpbitMarketInfo(raw);

    // KRW 마켓만 필터링
    const krw = formatted.filter((m) => m.quoteCurrency === 'KRW');

    // 이전 데이터 krw
    const prev = this.marketService.getAll();
    const diff = this.marketService.calcMarketDiff(prev, krw);

    if (diff.added.length > 0 || diff.removed.length > 0) {
      this.logger.verbose(
        `✅ added: ${diff.added.length}, removed: ${diff.removed.length}`,
      );
    } else {
      this.logger.log('✅ market sync: 변경사항 없음');
    }

    this.marketService.setAll(krw);

    return diff;
  }
}
