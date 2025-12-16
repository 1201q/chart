import { Controller, Get, Sse, MessageEvent, Param } from '@nestjs/common';
import { EMPTY, interval, map, merge, Observable, of } from 'rxjs';

import { MarketCandle, UpbitCandleType } from '@chart/shared-types';

import { CandleStreamService } from './candle-stream.service';

@Controller()
export class CandleController {
  constructor(private readonly candleStream: CandleStreamService) { }

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
          type: 'snapshot',
          data: recent,
        })
        : EMPTY;

    const realtime$: Observable<MessageEvent> = this.candleStream
      .candlesByCodeAndUnit$(upperCode, candleType)
      .pipe(map((trade) => ({ event: 'candle', type: 'realtime', data: trade })));

    const heartbeat$: Observable<MessageEvent> = interval(15000).pipe(
      map(() => ({
        event: 'heartbeat',
        type: 'heartbeat',
        data: 'ping',
      })),
    );

    return merge(snapshot$, realtime$, heartbeat$);
  }
}
