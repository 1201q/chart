import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UpbitMarket } from './entities/upbit-market.entity';
import { Repository } from 'typeorm';
import type { Response } from 'express';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

type FetchIconResult = {
  ok: boolean;
  notModified: boolean;
  etag?: string;
  contentType?: string;
  body?: ReadableStream<Uint8Array>;
};

@Injectable()
export class MarketIconService {
  private readonly logger = new Logger(MarketIconService.name);

  constructor(
    @InjectRepository(UpbitMarket)
    private readonly upbitMarketRepo: Repository<UpbitMarket>,
  ) {}

  private readonly cacheHeader = 'public, max-age=31536000, s-maxage=31536000, immutable';

  normalizeSymbol(symbol: string): string {
    return symbol.replace(/^KRW-/, '').toUpperCase().trim();
  }

  setCacheHeaders(res: Response) {
    // 브라우저 + cdn 캐시 강제
    res.setHeader('Cache-Control', this.cacheHeader);

    // 클플 캐시 강제
    res.setHeader('CDN-Cache-Control', this.cacheHeader);
    res.setHeader('Surrogate-Control', this.cacheHeader);

    // 캐시키 흔들리지않게 vary
    res.removeHeader('Vary');
  }

  async getIconUrlBySymbol(symbol: string) {
    const market = await this.upbitMarketRepo.findOne({
      where: { assetSymbol: symbol },
      relations: ['coinInfo'],
    });

    return market.coinInfo.iconPublicUrl ?? null;
  }

  async fetchIcon(
    symbol: string,
    opts: { ifNoneMatch?: string },
  ): Promise<FetchIconResult> {
    const url = await this.getIconUrlBySymbol(symbol);

    if (!url) return { ok: false, notModified: false };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const headers: Record<string, string> = {};

      if (opts.ifNoneMatch) {
        headers['If-None-Match'] = opts.ifNoneMatch;
      }

      const upstream = await fetch(url, {
        signal: controller.signal,
        headers,
      });

      // 304면 그대로 내려주기
      if (upstream.status === 304) {
        return { ok: true, notModified: true };
      }

      if (!upstream.ok || !upstream.body) {
        return { ok: false, notModified: false };
      }

      // content-type이 application/octet-stream으로 오는 경우가 있어 보정
      const ct = upstream.headers.get('content-type') ?? '';
      const contentType = ct.includes('image/') ? ct : 'image/png';

      const etag = upstream.headers.get('etag') ?? undefined;

      if (etag && opts.ifNoneMatch && opts.ifNoneMatch === etag) {
        return { ok: true, notModified: true };
      }

      return {
        ok: true,
        notModified: false,
        etag,
        contentType,
        body: upstream.body,
      };
    } catch {
      return { ok: false, notModified: false };
    } finally {
      clearTimeout(timeout);
    }
  }

  async streamToResponse(body: ReadableStream<Uint8Array>, res: Response) {
    const nodeStream = Readable.fromWeb(body);
    await pipeline(nodeStream, res);
  }
}
