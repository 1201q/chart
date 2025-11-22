import { MarketDiff, MarketInfo, MarketInfoRes } from '@chart/shared-types';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);

  private markets: MarketInfo[] = [];
  private lastUpdatedAt: Date | null = null;

  getAll(): MarketInfo[] {
    return this.markets;
  }

  getKrwMarkets(): MarketInfo[] {
    return this.markets.filter((m) => m.quoteCurrency === 'KRW');
  }

  setAll(markets: MarketInfo[]): void {
    this.logger.log(`✅✅✅ ${markets.length}개의 마켓 세팅 ✅✅✅`);
    this.markets = markets;
    this.lastUpdatedAt = new Date();
  }

  hasMarkets(): boolean {
    return this.markets.length > 0;
  }

  getLastUpdatedAt(): Date | null {
    return this.lastUpdatedAt;
  }

  /**
   * upbit res -> market info 변환
   *
   */
  formatUpbitMarketInfo(raw: MarketInfoRes[]): MarketInfo[] {
    return raw.map((item) => {
      const [quote, base] = item.market.split('-'); // KRW-BTC -> [KRW, BTC"]

      return {
        code: item.market,
        koreanName: item.korean_name,
        englishName: item.english_name,
        quoteCurrency: quote,
        baseCurrency: base,
      };
    });
  }

  /**
   * 이전 마켓과 새로운 마켓 비교
   *
   */
  calcMarketDiff(prev: MarketInfo[], next: MarketInfo[]): MarketDiff {
    const prevSet = new Set(prev.map((item) => item.code));
    const nextSet = new Set(next.map((item) => item.code));

    const added = next.filter((item) => !prevSet.has(item.code));
    const removed = prev.filter((item) => !nextSet.has(item.code));

    return { added, removed };
  }
}
