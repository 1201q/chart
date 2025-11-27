import { Controller, Get, Param, Query } from '@nestjs/common';
import { CandlesService } from './candles.service';
import { GetCandlesQueryDto } from './candles.dto';

import {
  UpbitCandleTimeframeUrl,
  CandleResponseDto,
} from '@chart/shared-types';

@Controller('candles/test')
export class CandlesController {
  constructor(private readonly candlesService: CandlesService) {}

  @Get(':timeframe/:market')
  async getCandles(
    @Param('timeframe') timeframe: UpbitCandleTimeframeUrl,
    @Param('market') market: string,
    @Query() query: GetCandlesQueryDto,
  ): Promise<CandleResponseDto[]> {
    return this.candlesService.getCandles(market, timeframe, query);
  }
}
