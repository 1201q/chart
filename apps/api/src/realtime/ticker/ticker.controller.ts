import { Controller, Get, Sse, MessageEvent, Param } from '@nestjs/common';
import { EMPTY, interval, map, merge, Observable, of } from 'rxjs';
import { TickerStreamService } from './ticker-stream.service';
import { MarketTicker, MarketTickerWithNamesMap } from '@chart/shared-types';
import { MarketService } from 'src/market/market.service';
import { Public } from 'src/auth/decorators/public.decorator';

@Public()
@Controller()
export class TickerController {
  constructor(
    private readonly tickerStream: TickerStreamService,
    private readonly market: MarketService,
  ) {}

  @Get(`tickers/snapshot`)
  getSnapshot(): MarketTickerWithNamesMap {
    const snapshot = this.tickerStream.getSnapshot();
    const markets = this.market.getAll();

    return markets.reduce<MarketTickerWithNamesMap>((result, market) => {
      const ticker = snapshot[market.code];
      if (ticker) {
        result[market.code] = {
          ...ticker,
          koreanName: market.koreanName,
          englishName: market.englishName,
        };
      }
      return result;
    }, {});
  }

  @Sse(`sse/tickers`)
  streamTickers(): Observable<MessageEvent> {
    const heartbeat$: Observable<MessageEvent> = interval(15000).pipe(
      map(() => ({
        type: 'heartbeat',
        data: 'ping',
      })),
    );

    const update$ = this.tickerStream.tickers$().pipe(
      map((ticker: MarketTicker) => ({
        type: 'realtime',
        data: ticker,
      })),
    );

    return merge(update$, heartbeat$);
  }

  @Sse(`sse/ticker/:code`)
  streamTickerByCode(@Param('code') code: string): Observable<MessageEvent> {
    const upperCode = decodeURIComponent(code).toUpperCase();

    const snapshot = this.tickerStream.getSnapshotByCode(upperCode);

    const snapshot$: Observable<MessageEvent> = snapshot
      ? of({
          type: 'snapshot',
          data: snapshot,
        })
      : EMPTY;

    const update$: Observable<MessageEvent> = this.tickerStream
      .tickerByCode$(upperCode)
      .pipe(map((ticker) => ({ type: 'realtime', data: ticker })));

    const heartbeat$: Observable<MessageEvent> = interval(15000).pipe(
      map(() => ({
        type: 'heartbeat',
        data: 'ping',
      })),
    );

    return merge(snapshot$, update$, heartbeat$);
  }
}
