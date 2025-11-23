import {
  MarketCandle,
  UpbitCandleSimpleRaw,
  UpbitCandleType,
  mapUpbitCandleSimpleToMarketCandle,
} from '@chart/shared-types';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Subject, Observable, filter } from 'rxjs';

import { UpbitWebsocketClient } from 'src/upbit/upbit-websocket.client';

const MAX_CANDLES_PER_SERIES = 50;

const makeKey = (code: string, type: UpbitCandleType) =>
  `${code.toUpperCase()}_${type}`;

@Injectable()
export class CandleStreamService implements OnModuleInit {
  private readonly logger = new Logger(CandleStreamService.name);

  private readonly candleSubject = new Subject<MarketCandle>();
  private readonly candleHistory = new Map<string, MarketCandle[]>();

  constructor(private readonly wsClient: UpbitWebsocketClient) {}

  async onModuleInit() {
    // 메시지를 map + subject로 반영
    this.wsClient.candle$.subscribe((raw: UpbitCandleSimpleRaw) =>
      this.handleRawCandle(raw),
    );
  }

  private handleRawCandle(raw: UpbitCandleSimpleRaw) {
    if (!raw.cd.startsWith('KRW-')) return;

    const candle = mapUpbitCandleSimpleToMarketCandle(raw);
    const key = makeKey(candle.code, candle.type);

    // 히스토리 갱신
    const list = this.candleHistory.get(key) ?? [];
    list.push(candle);

    if (list.length > MAX_CANDLES_PER_SERIES) {
      list.splice(0, list.length - MAX_CANDLES_PER_SERIES);
    }

    // map 갱신
    this.candleHistory.set(key, list);

    // 실시간 스트림 발행
    this.candleSubject.next(candle);
  }

  candles$(): Observable<MarketCandle> {
    return this.candleSubject.asObservable();
  }

  candlesByCodeAndUnit$(
    code: string,
    type: UpbitCandleType,
  ): Observable<MarketCandle> {
    const upperCode = code.toUpperCase();
    return this.candles$().pipe(
      filter(
        (candle) =>
          candle.code.toUpperCase() === upperCode && candle.type === type,
      ),
    );
  }

  getRecentCandles(code: string, type: UpbitCandleType): MarketCandle[] {
    const key = makeKey(code, type);
    return this.candleHistory.get(key) ?? [];
  }
}
