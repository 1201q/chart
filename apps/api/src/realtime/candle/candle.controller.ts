import { Controller, Get, Sse, MessageEvent, Param } from '@nestjs/common';
import { EMPTY, interval, map, merge, Observable, of } from 'rxjs';

import { MarketCandle, UpbitCandleType } from '@chart/shared-types';

import { CandleStreamService } from './candle-stream.service';
import { CandleVolumeTracker } from './candle-volume-tracker.service';

@Controller()
export class CandleController {
  constructor(
    private readonly candleStream: CandleStreamService,
    private readonly volumeTracker: CandleVolumeTracker,
  ) {}

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
            type: 'snapshot',
            data: recent,
          })
        : EMPTY;

    const realtime$: Observable<MessageEvent> = this.candleStream
      .candlesByCodeAndUnit$(upperCode, candleType)
      .pipe(map((trade) => ({ type: 'realtime', data: trade })));

    const heartbeat$: Observable<MessageEvent> = interval(15000).pipe(
      map(() => ({
        type: 'heartbeat',
        data: 'ping',
      })),
    );

    return merge(snapshot$, realtime$, heartbeat$);
  }

  @Get('candle-volume/status')
  async getVolumeTrackerStatus() {
    return this.volumeTracker.getStatus();
  }

  @Get('candle-volume/daily/:market')
  async getDailyVolume(@Param('market') market: string) {
    const upperMarket = decodeURIComponent(market).toUpperCase();
    const data = await this.volumeTracker.getDailyVolume(upperMarket);
    return {
      ...data,
      period: 'daily',
    };
  }

  @Get('candle-volume/weekly/:market')
  async getWeeklyVolume(@Param('market') market: string) {
    const upperMarket = decodeURIComponent(market).toUpperCase();
    const data = await this.volumeTracker.getWeeklyVolume(upperMarket);
    return {
      ...data,
      period: 'weekly',
    };
  }

  @Get('candle-volume/monthly/:market')
  async getMonthlyVolume(@Param('market') market: string) {
    const upperMarket = decodeURIComponent(market).toUpperCase();
    const data = await this.volumeTracker.getMonthlyVolume(upperMarket);
    return {
      ...data,
      period: 'monthly',
    };
  }

  @Get('candle-volume/debug/:market')
  async debugDailyVolume(@Param('market') market: string) {
    const upperMarket = decodeURIComponent(market).toUpperCase();
    return this.volumeTracker.debugDailyVolume(upperMarket);
  }

  @Get('candle-volume/missing-markets')
  async getMissingMarkets() {
    return this.volumeTracker.getMissingMarkets();
  }
}
