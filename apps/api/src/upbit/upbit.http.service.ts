import { Injectable, Logger } from '@nestjs/common';
import {
  CandleResponseDto,
  MarketInfoRes,
  UpbitCandleTimeframeUrl,
  UpbitRestCandleRaw,
} from '@chart/shared-types';

@Injectable()
export class UpbitHttpService {
  private readonly logger = new Logger(UpbitHttpService.name);

  async getAllmarkets(): Promise<MarketInfoRes[]> {
    const url = 'https://api.upbit.com/v1/market/all';

    this.logger.verbose(`⬇️ fetch: Fetching all markets from Upbit: ${url}`);

    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      const text = await res.text();
      this.logger.error(
        `❌ fail: to fetch all markets from Upbit: ${res.status} ${res.statusText} - ${text}`,
      );

      throw new Error(
        `Upbit API request failed: ${res.status} ${res.statusText}`,
      );
    }

    const data = (await res.json()) as MarketInfoRes[];

    return data;
  }

  async getCandles(
    market: string,
    timeframeUrl: UpbitCandleTimeframeUrl,
    count: number,
  ): Promise<UpbitRestCandleRaw[]> {
    const baseurl = 'https://api.upbit.com/v1/candles';
    const checkCount = Math.min(count, 200);

    const url = `${baseurl}/${timeframeUrl}?market=${encodeURIComponent(
      market,
    )}&count=${checkCount}`;

    this.logger.verbose(`⬇️ fetch: Fetching candles from Upbit: ${url}`);

    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      const text = await res.text();
      this.logger.error(
        `❌ fail: to fetch all markets from Upbit: ${res.status} ${res.statusText} - ${text}`,
      );
      return [];
    }

    const data = (await res.json()) as UpbitRestCandleRaw[];

    return data;
  }
}
