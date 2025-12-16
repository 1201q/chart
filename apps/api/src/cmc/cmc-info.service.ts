import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CmcInfoItem, CmcInfoResponse, CmcInfoResponseById } from './cmc-info.types';
import { InjectRepository } from '@nestjs/typeorm';
import { UpbitMarket } from 'src/market/entities/upbit-market.entity';
import { In, Repository } from 'typeorm';
import { CoinInfo } from 'src/market/entities/coin-info.entity';

@Injectable()
export class CmcInfoService {
  private readonly logger = new Logger(CmcInfoService.name);
  private readonly baseUrl = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/info`;

  constructor(
    private readonly configService: ConfigService,

    @InjectRepository(UpbitMarket)
    private readonly upbitMarketRepo: Repository<UpbitMarket>,

    @InjectRepository(CoinInfo)
    private readonly coinInfoRepo: Repository<CoinInfo>,
  ) {}

  async fetchBySymbols(symbols: string[]) {
    const symbolStr = symbols.join(',');

    const qs = new URLSearchParams({
      symbol: symbolStr,
      skip_invalid: 'true',
      aux: 'urls,logo,description,date_added',
    }).toString();

    const url = `${this.baseUrl}?${qs}`;

    const res = await fetch(url, {
      headers: {
        'X-CMC_PRO_API_KEY': this.configService.get<string>('CMC_API_KEY') || '',
        Accept: 'application/json',
      },
    });

    return res;
  }

  async fetchByIds(ids: number[]) {
    const idStr = ids.join(',');

    const qs = new URLSearchParams({
      id: idStr,
      skip_invalid: 'true',
      aux: 'urls,logo,description,date_added',
    }).toString();

    const url = `${this.baseUrl}?${qs}`;

    const res = await fetch(url, {
      headers: {
        'X-CMC_PRO_API_KEY': this.configService.get<string>('CMC_API_KEY') || '',
        Accept: 'application/json',
      },
    });

    return res;
  }

  private async getActiveKrwUpbitMarkets() {
    const markets = await this.upbitMarketRepo.find({
      where: { isActive: 1, marketCurrency: 'KRW' },
    });

    return markets;
  }

  async test() {
    const markets = await this.getActiveKrwUpbitMarkets();
    const codes = this.extractUniqueSymbols(markets);

    const res = await this.fetchBySymbols(codes);
    const json = (await res.json()) as CmcInfoResponse;

    const symbolMap = this.buildSymbolIdMap(markets, json.data);

    const ids = Object.values(symbolMap).filter((id) => id && id > 0);

    const res2 = await this.fetchByIds(ids);
    const json2 = (await res2.json()) as CmcInfoResponseById;

    return json2;
  }

  extractUniqueSymbols(markets: UpbitMarket[]): string[] {
    return Array.from(
      new Set([
        ...markets.map((m) => m.assetSymbol),
        ...markets.map((m) => m.assetSymbolNormalized).filter(Boolean),
      ]),
    );
  }

  buildSymbolIdMap(markets: UpbitMarket[], cmcData: Record<string, CmcInfoItem[]>) {
    const result: Record<string, number> = {};

    for (const m of markets) {
      const symbol = (m.assetSymbol || '').toUpperCase();
      if (!symbol) continue;

      const candidates = cmcData[symbol];

      // 1. symbol로 1차 검사
      if (!candidates || candidates.length === 0) continue;

      // 2. 심볼이 있음 -> 후보가 1개인 경우 바로 매핑
      if (candidates.length === 1) {
        result[symbol] = candidates[0].id;
        continue;
      }

      // 3. 심볼이 있음 -> 후보가 여러개면 symbol 검사, englishName 검사, englishName split 공백 [0] 포함 검사
      const matchedBySymbol = candidates.find(
        (c) => c.symbol.toUpperCase() === symbol.toUpperCase(),
      );

      if (matchedBySymbol) {
        result[symbol] = matchedBySymbol.id;
        continue;
      }

      const matchedByName = candidates.find(
        (c) => c.name.toLowerCase() === (m.englishName ?? '').toLowerCase(),
      );

      if (matchedByName) {
        result[symbol] = matchedByName.id;
        continue;
      }

      const matchedByNamePart = candidates.find((c) => {
        const nameParts = (m.englishName ?? '').toLowerCase().split(' ');
        const targetParts = c.name.split(' ').map((p) => p.toLowerCase());

        return nameParts.some((part) => targetParts.includes(part));
      });

      if (matchedByNamePart) {
        result[symbol] = matchedByNamePart.id;
        continue;
      }

      // 4.그래도 못찾으면 0으로 매핑
      this.logger.log(
        `입력: ${symbol}/${m.englishName} | 타겟: ${JSON.stringify(cmcData[symbol].map((c) => `${c.name}/${c.symbol}`))}`,
      );
      result[symbol] = 0;
    }

    return result;
  }

  findCmcIdForMarket(market: UpbitMarket, cmcData: Record<string, CmcInfoItem[]>) {
    const candidatesSymbols = [market.assetSymbolNormalized, market.assetSymbol]
      .filter(Boolean)
      .map((s) => s!.toUpperCase());

    const targetName = (market.englishName ?? '').trim().toLowerCase();

    for (const symbol of candidatesSymbols) {
      const candidates = cmcData[symbol];
      if (!candidates || candidates.length === 0) continue;

      if (candidates.length === 1) {
        return { requestSymbol: symbol, cmcId: candidates[0].id };
      }

      const matchedBySymbol = candidates.find((c) => c.symbol.toUpperCase() === symbol);
      if (matchedBySymbol) {
        return { requestSymbol: symbol, cmcId: matchedBySymbol.id };
      }

      const matchedByName = candidates.find(
        (c) => (c.name ?? '').trim().toLowerCase() === targetName,
      );
      if (matchedByName) {
        return { requestSymbol: symbol, cmcId: matchedByName.id };
      }

      const matchedBySlug = candidates.find(
        (c) => (c.slug ?? '').trim().toLowerCase() === targetName,
      );
      if (matchedBySlug) {
        return { requestSymbol: symbol, cmcId: matchedBySlug.id };
      }

      const matchedByNamePart = candidates.find((c) => {
        const nameParts = targetName.split(/\s+/).filter(Boolean);
        const targetParts = (c.name ?? '').toLowerCase().split(/\s+/).filter(Boolean);
        return nameParts.some((part) => targetParts.includes(part));
      });

      if (matchedByNamePart) {
        return { requestSymbol: symbol, cmcId: matchedByNamePart.id };
      }

      this.logger.log(
        `CMC ambiguous: symbol=${symbol}, candidates=${candidates.map((c) => `${c.name}/${c.symbol}`).join(', ')}`,
      );
    }

    return null;
  }
}
