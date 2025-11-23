import { Controller, Get, Sse, MessageEvent, Param } from '@nestjs/common';
import { EMPTY, map, merge, Observable, of } from 'rxjs';

import { MarketTrade } from '@chart/shared-types';

import { TradeStreamService } from './trade-stream.service';

@Controller()
export class TradeController {
  constructor(private readonly tradeStream: TradeStreamService) {}

  @Get(`trades/:code`)
  getRecentTrades(@Param('code') code: string): MarketTrade[] {
    const upperCode = decodeURIComponent(code).toUpperCase();
    return this.tradeStream.getRecentTrades(upperCode);
  }

  @Sse(`sse/trade/:code`)
  streamTickerByCode(@Param('code') code: string): Observable<MessageEvent> {
    const upperCode = decodeURIComponent(code).toUpperCase();

    const recent = this.tradeStream.getRecentTrades(upperCode);

    const snapshot$: Observable<MessageEvent> =
      recent.length > 0
        ? of({
            event: 'trade',
            data: recent,
          })
        : EMPTY;

    const realtime$: Observable<MessageEvent> = this.tradeStream
      .tradesByCode$(upperCode)
      .pipe(map((trade) => ({ event: 'trade', data: trade })));

    return merge(snapshot$, realtime$);
  }
}
