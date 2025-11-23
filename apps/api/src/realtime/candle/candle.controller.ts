import { Controller, Get, Sse, MessageEvent, Param } from '@nestjs/common';
import { EMPTY, map, merge, Observable, of } from 'rxjs';

import { MarketCandle, UpbitCandleType } from '@chart/shared-types';

import { CandleStreamService } from './candle-stream.service';

@Controller()
export class CandleController {
  constructor(private readonly candleStream: CandleStreamService) {}

  @Get('candles/:type/:code')
  getRecentTrades(
    @Param('type') type: UpbitCandleType,
    @Param('code') code: string,
  ): MarketCandle[] {
    const upperCode = decodeURIComponent(code).toUpperCase();
    const candleType = type as UpbitCandleType;

    return this.candleStream.getRecentCandles(upperCode, candleType);
  }

  @Sse(`sse/candle/:type/:code`)
  streamTickerByCode(
    @Param('type') type: UpbitCandleType,
    @Param('code') code: string,
  ): Observable<MessageEvent> {
    const upperCode = decodeURIComponent(code).toUpperCase();
    const candleType = type as UpbitCandleType;

    const recent = this.candleStream.getRecentCandles(upperCode, candleType);

    const snapshot$: Observable<MessageEvent> =
      recent.length > 0
        ? of({
            event: 'candle',
            data: recent,
          })
        : EMPTY;

    const realtime$: Observable<MessageEvent> = this.candleStream
      .candlesByCodeAndUnit$(upperCode, candleType)
      .pipe(map((trade) => ({ event: 'candle', data: trade })));

    return merge(snapshot$, realtime$);
  }
}
