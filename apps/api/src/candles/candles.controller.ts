import { Controller, Get, Param, Query } from '@nestjs/common';
import { CandlesService } from './candles.service';
import { GetCandlesQueryDto } from './candles.dto';
import { CandleResponseDto } from './candles.dto';
import { CandleTimeframeUrl } from './candles.types';

@Controller('candles/test')
export class CandlesController {
  constructor(private readonly candlesService: CandlesService) {}

  @Get(':timeframe/:market')
  async getCandles(
    @Param('timeframe') timeframe: CandleTimeframeUrl,
    @Param('market') market: string,
    @Query() query: GetCandlesQueryDto,
  ): Promise<CandleResponseDto[]> {
    return this.candlesService.getCandles(market, timeframe, query);
  }
}
