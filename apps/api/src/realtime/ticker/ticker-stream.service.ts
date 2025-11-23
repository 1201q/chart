import {
  mapUpbitTickerSimpleToMarketTicker,
  MarketTicker,
  UpbitTickerSimpleRaw,
  MarketTickerMap,
} from '@chart/shared-types';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Subject, Observable, filter } from 'rxjs';

import { UpbitWebsocketClient } from 'src/upbit/upbit-websocket.client';

@Injectable()
export class TickerStreamService implements OnModuleInit {
  private readonly logger = new Logger(TickerStreamService.name);

  private readonly tickerMap = new Map<string, MarketTicker>();
  private readonly tickerSubject = new Subject<MarketTicker>();

  private lastMessageAt: Date | null = null;
  private totalMessages = 0;

  constructor(private readonly wsClient: UpbitWebsocketClient) {}

  async onModuleInit() {
    // 메시지를 map + subject로 반영
    this.wsClient.ticker$.subscribe((raw: UpbitTickerSimpleRaw) =>
      this.handleRawTicker(raw),
    );
  }

  private handleRawTicker(raw: UpbitTickerSimpleRaw) {
    if (!raw.cd.startsWith('KRW-')) return;

    const ticker = mapUpbitTickerSimpleToMarketTicker(raw);

    // map 갱신
    this.tickerMap.set(ticker.code, ticker);

    // 실시간 스트림 발행
    this.tickerSubject.next(ticker);

    this.lastMessageAt = new Date();
    this.totalMessages += 1;
  }

  // 전체 스냅샷 반환
  getSnapshot(): MarketTickerMap {
    return Object.fromEntries(this.tickerMap.entries());
  }

  // 특정 코드의 스냅샷 반환
  getSnapshotByCode(code: string): MarketTicker | null {
    const upperCode = code.toUpperCase();
    return this.tickerMap.get(upperCode) ?? null;
  }

  tickers$(): Observable<MarketTicker> {
    return this.tickerSubject.asObservable();
  }

  tickerByCode$(code: string): Observable<MarketTicker> {
    const upperCode = code.toUpperCase();
    return this.tickers$().pipe(
      filter((ticker) => ticker.code.toUpperCase() === upperCode),
    );
  }

  getHealthSnapshot() {
    return {
      lastMessageAt: this.lastMessageAt,
      totalMessages: this.totalMessages,
      codes: this.tickerMap.size,
    };
  }
}
