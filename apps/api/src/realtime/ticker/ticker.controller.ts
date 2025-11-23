import { Controller, Get, Sse, MessageEvent, Param } from '@nestjs/common';
import { EMPTY, map, merge, Observable, of } from 'rxjs';
import { TickerStreamService } from './ticker-stream.service';
import { MarketTicker, MarketTickerWithNamesMap } from '@chart/shared-types';
import { MarketService } from 'src/market/market.service';

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
          event: 'ticker',
          data: snapshot,
        })
      : EMPTY;

    const update$: Observable<MessageEvent> = this.tickerStream
      .tickerByCode$(upperCode)
      .pipe(map((ticker) => ({ event: 'ticker', data: ticker })));

    return merge(snapshot$, update$);
  }
}
