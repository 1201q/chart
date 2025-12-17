import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CmcInfoItem } from './cmc-info.types';

import { UpbitMarket } from 'src/market/entities/upbit-market.entity';

@Injectable()
export class CmcInfoService {
  private readonly logger = new Logger(CmcInfoService.name);
  private readonly baseUrl = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/info`;

  constructor(private readonly configService: ConfigService) {}

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

  extractUniqueSymbols(markets: UpbitMarket[]): string[] {
    return Array.from(
      new Set([
        ...markets.map((m) => m.assetSymbol),
        ...markets.map((m) => m.assetSymbolNormalized).filter(Boolean),
      ]),
    );
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
