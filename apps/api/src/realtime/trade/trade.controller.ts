import { Controller, Get, Sse, MessageEvent, Param } from '@nestjs/common';
import { EMPTY, interval, map, merge, Observable, of } from 'rxjs';

import { MarketTradeWithId } from '@chart/shared-types';

import { TradeStreamService } from './trade-stream.service';

@Controller()
export class TradeController {
  constructor(private readonly tradeStream: TradeStreamService) { }

  @Get(`trades/:code`)
  getRecentTrades(@Param('code') code: string): MarketTradeWithId[] {
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
          type: 'snapshot',
          data: recent,
        })
        : EMPTY;

    const realtime$: Observable<MessageEvent> = this.tradeStream
      .tradesByCode$(upperCode)
      .pipe(
        map((trade) => ({ event: 'trade', type: 'realtime', data: trade })),
      );

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
