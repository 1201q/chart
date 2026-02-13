import { Controller, Get, Sse, MessageEvent, Param } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { MockOrderbookStreamService } from './mock-orderbook-stream.service';
import { MockTickerStreamService } from './mock-ticker-stream.service';
import { MockTradeStreamService } from './mock-trade-stream.service';
import { MarketTickerWithNamesMap } from '@chart/shared-types';
import { MarketService } from 'src/market/market.service';
import { Public } from 'src/auth/decorators/public.decorator';

@Public()
@Controller('mock')
export class MockController {
  constructor(
    private readonly orderbook: MockOrderbookStreamService,
    private readonly ticker: MockTickerStreamService,
    private readonly trade: MockTradeStreamService,
    private readonly market: MarketService,
  ) {}

  @Get(`orderbook/:code`)
  getOrderbookSnapshot(@Param('code') code: string) {
    return this.orderbook.getSnapshotByCode(code.toUpperCase());
  }

  @Sse(`sse/orderbook/:code`)
  streamOrderbookByCode(@Param('code') code: string): Observable<MessageEvent> {
    const upperCode = decodeURIComponent(code).toUpperCase();

    return this.orderbook.orderbookByCode$(upperCode).pipe(
      map((orderbook) => ({
        type: 'realtime',
        data: orderbook,
      })),
    );
  }

  @Get(`tickers/snapshot`)
  getSnapshot(): MarketTickerWithNamesMap {
    const snapshot = this.ticker.getSnapshot();
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
    return this.ticker.tickers$().pipe(
      map((ticker) => ({
        type: 'realtime',
        data: ticker,
      })),
    );
  }

  @Get(`trades/:code`)
  getRecentTrades(@Param('code') code: string) {
    const upperCode = decodeURIComponent(code).toUpperCase();
    return this.trade.getRecentTrades(upperCode);
  }

  @Sse(`sse/trade/:code`)
  streamTickerByCode(@Param('code') code: string): Observable<MessageEvent> {
    const upperCode = decodeURIComponent(code).toUpperCase();

    return this.trade
      .tradesByCode$(upperCode)
      .pipe(map((trade) => ({ type: 'realtime', data: trade })));
  }
}
