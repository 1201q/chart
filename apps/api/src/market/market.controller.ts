import { Controller, Get, HttpCode, HttpStatus, Param, Req, Res } from '@nestjs/common';
import { MarketService } from './market.service';
import { MarketSyncService } from './market.sync.service';
import { MarketInfo } from '@chart/shared-types';

import type { Response } from 'express';
import { MarketIconService } from './market.icon.service';

@Controller('markets')
export class MarketController {
  constructor(
    private readonly marketService: MarketService,
    private readonly marketSyncService: MarketSyncService,
    private readonly marketIconService: MarketIconService,
  ) {}

  /**
   * 현재 캐시된 마켓 리스트를 반환.
   * 캐시가 비어있으면 Upbit에서 한 번 sync 후 반환.
   */

  @Get()
  @HttpCode(HttpStatus.OK)
  async getMarkets(): Promise<MarketInfo[]> {
    if (!this.marketService.hasMarkets()) {
      await this.marketSyncService.syncMarket();
    }
    return this.marketService.getAll();
  }

  // @Get('icon/:symbol')
  // async getIcon(@Param('symbol') symbol: string, @Res() res: Response) {
  //   const url = await this.marketService.getIconUrlBySymbol(symbol);

  //   return res.redirect(302, url);
  // }

  @Get('icon/:symbol')
  async getIcon(
    @Param('symbol') symbol: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const symbolNorm = this.marketIconService.normalizeSymbol(symbol);

    this.marketIconService.setCacheHeaders(res);

    const ifNoneMatch = req.headers['if-none-match'];

    const result = await this.marketIconService.fetchIcon(symbolNorm, {
      ifNoneMatch: Array.isArray(ifNoneMatch) ? ifNoneMatch[0] : ifNoneMatch,
    });

    if (result.notModified) {
      res.status(304).end();
      return;
    }

    if (!result.ok) {
      res.status(404).end();
      return;
    }

    if (!result.body) {
      res.status(404).end();
      return;
    }

    if (result.contentType) res.setHeader('Content-Type', result.contentType);
    if (result.etag) res.setHeader('ETag', result.etag);

    await this.marketIconService.streamToResponse(result.body, res);
  }
}
