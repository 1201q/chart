import { MarketDiff, MarketInfo, MarketInfoRes } from '@chart/shared-types';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);

  private markets: MarketInfo[] = [];

  getAll(): MarketInfo[] {
    return this.markets;
  }

  setAll(markets: MarketInfo[]): void {
    this.logger.log(`Setting ${markets.length} markets`);
    this.markets = markets;
  }

  hasMarkets(): boolean {
    return this.markets.length > 0;
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
