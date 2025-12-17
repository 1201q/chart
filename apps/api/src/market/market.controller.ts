import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { MarketService } from './market.service';
import { MarketSyncService } from './market.sync.service';
import { MarketInfo } from '@chart/shared-types';

@Controller('markets')
export class MarketController {
  constructor(
    private readonly marketService: MarketService,
    private readonly marketSyncService: MarketSyncService,
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

  @Get('icon/:symbol')
  async getIcon(@Param('symbol') symbol: string): Promise<string> {
    return this.marketService.getIconUrlBySymbol(symbol);
  }
}
