import { Controller, Get, Sse, MessageEvent, Param } from '@nestjs/common';
import { EMPTY, map, merge, Observable, of } from 'rxjs';
import { TickerStreamService } from './ticker-stream.service';
import { MarketTickerMap, MarketTicker } from '@chart/shared-types';

@Controller()
export class TickerController {
  constructor(private readonly tickerStream: TickerStreamService) {}

  @Get(`tickers/snapshot`)
  getSnapshot(): MarketTickerMap {
    return this.tickerStream.getSnapshot();
  }

  @Sse(`sse/tickers`)
  streamTickers(): Observable<MessageEvent> {
    return this.tickerStream.tickers$().pipe(
      map((ticker: MarketTicker) => ({
        event: 'ticker',
        data: ticker,
      })),
    );
  }

  @Sse(`sse/ticker/:code`)
  streamTickerByCode(@Param('code') code: string): Observable<MessageEvent> {
    const upperCode = decodeURIComponent(code).toUpperCase();

    const snapshot = this.tickerStream.getSnapshotByCode(upperCode);

    const snapshot$: Observable<MessageEvent> = snapshot
      ? of({
          event: 'snapshot',
          data: snapshot,
        })
      : EMPTY;

    const update$: Observable<MessageEvent> = this.tickerStream
      .tickerByCode$(upperCode)
      .pipe(map((ticker) => ({ event: 'ticker', data: ticker })));

    return merge(snapshot$, update$);
  }
}
