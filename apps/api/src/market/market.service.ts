import { MarketDiff, MarketInfo, MarketInfoRes } from '@chart/shared-types';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UpbitMarket } from './entities/upbit-market.entity';
import { Repository } from 'typeorm';
import { CoinInfo } from './entities/coin-info.entity';

@Injectable()
export class MarketService implements OnModuleInit {
  private readonly logger = new Logger(MarketService.name);

  private markets: MarketInfo[] = []; // krw 마켓으로 한정
  private lastUpdatedAt: Date | null = null;

  constructor(
    @InjectRepository(UpbitMarket)
    private readonly upbitMarketRepo: Repository<UpbitMarket>,

    @InjectRepository(CoinInfo)
    private readonly coinInfoRepo: Repository<CoinInfo>,
  ) {}

  async onModuleInit() {
    await this.reloadMarketsFromDb();
  }

  async getActiveKrwMarkets(): Promise<UpbitMarket[]> {
    return this.upbitMarketRepo.find({
      where: { marketCurrency: 'KRW', isActive: 1 },
    });
  }

  async reloadMarketsFromDb(): Promise<MarketInfo[]> {
    const rows = await this.getActiveKrwMarkets();

    const markets: MarketInfo[] = rows.map((row) => ({
      code: row.marketCode,
      marketCurrency: row.marketCurrency,
      assetSymbol: row.assetSymbol,
      koreanName: row.koreanName,
      englishName: row.englishName,
    }));

    this.logger.log(`✅✅✅ db: ${markets.length}개의 KRW 마켓 세팅 ✅✅✅`);
    this.setAll(markets);

    return markets;
  }

  /** krw만 반환 */
  getAll(): MarketInfo[] {
    return this.markets;
  }

  setAll(markets: MarketInfo[]): void {
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
      const [currency, symbol] = item.market.split('-'); // KRW-BTC -> [KRW, BTC"]

      return {
        code: item.market,
        koreanName: item.korean_name,
        englishName: item.english_name,
        marketCurrency: currency, // KRW
        assetSymbol: symbol, // BTC
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

  async getIconUrlBySymbol(symbol: string) {
    const market = await this.upbitMarketRepo.findOne({
      where: { assetSymbol: symbol },
      relations: ['coinInfo'],
    });

    return market.coinInfo.iconPublicUrl;
  }
}
