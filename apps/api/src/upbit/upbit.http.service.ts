import { Injectable, Logger } from '@nestjs/common';
import {
  MarketInfoRes,
  UpbitCandleTimeframeUrl,
  UpbitRestCandleRaw,
} from '@chart/shared-types';
import { UpbitRateLimiter } from './upbit-rate-limiter.service';

@Injectable()
export class UpbitHttpService {
  private readonly logger = new Logger(UpbitHttpService.name);

  constructor(private readonly rateLimiter: UpbitRateLimiter) {}

  async getAllmarkets(): Promise<MarketInfoRes[]> {
    return this.rateLimiter.execute(async () => {
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

        throw new Error(`Upbit API request failed: ${res.status} ${res.statusText}`);
      }

      const data = (await res.json()) as MarketInfoRes[];

      return data;
    });
  }

  async getCandles(
    market: string,
    timeframeUrl: UpbitCandleTimeframeUrl,
    count: number,
  ): Promise<UpbitRestCandleRaw[]> {
    return this.rateLimiter.execute(async () => {
      const baseurl = 'https://api.upbit.com/v1/candles';
      const checkCount = Math.min(count, 200);

      // 분봉 처리
      let urlPath: string;
      if (timeframeUrl.endsWith('m')) {
        // 240m ---> minutes/240
        const minutes = timeframeUrl.slice(0, -1);
        urlPath = `minutes/${minutes}`;
      } else {
        // 분봉말고 다른 것들 처리
        urlPath = timeframeUrl;
      }

      const url = `${baseurl}/${urlPath}?market=${encodeURIComponent(
        market,
      )}&count=${checkCount}`;

      this.logger.verbose(`⬇️ fetch: Fetching candles from Upbit: ${url}`);

      // 429 재시도를 rate limiter 콜백 안에서 처리
      // (재귀호출로 rateLimiter.execute()를 다시 호출하면 데드락 발생)
      const maxRetries = 3;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const res = await fetch(url, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(10_000),
        });

        if (res.status === 429) {
          const retryAfter = res.headers.get('Retry-After') ?? '1';
          const waitMs = Number(retryAfter) * 1000;
          this.logger.warn(
            `Rate limited (attempt ${attempt + 1}/${maxRetries + 1}). Retry after ${retryAfter}s`,
          );
          if (attempt < maxRetries) {
            await this.sleep(waitMs);
            continue;
          }
          this.logger.error('Rate limit retries exhausted');
          return [];
        }

        if (!res.ok) {
          const text = await res.text();
          this.logger.error(
            `❌ fail: to fetch candles from Upbit: ${res.status} ${res.statusText} - ${text}`,
          );
          return [];
        }

        return (await res.json()) as UpbitRestCandleRaw[];
      }

      return [];
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
