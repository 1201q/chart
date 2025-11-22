import {
  mapUpbitTickerSimpleToMarketTicker,
  MarketTicker,
  UpbitTickerSimpleRaw,
  MarketTickerMap,
} from '@chart/shared-types';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Subject, Observable, filter } from 'rxjs';

import { MarketService } from 'src/market/market.service';
import { MarketSyncService } from 'src/market/market.sync.service';
import { UpbitWebsocketClient } from 'src/upbit/upbit-websocket.client';

@Injectable()
export class TickerStreamService implements OnModuleInit {
  private readonly logger = new Logger(TickerStreamService.name);

  private readonly tickerMap = new Map<string, MarketTicker>();
  private readonly tickerSubject = new Subject<MarketTicker>();

  constructor(
    private readonly wsClient: UpbitWebsocketClient,
    private readonly marketService: MarketService,
    private readonly marketSyncService: MarketSyncService,
  ) {}

  async onModuleInit() {
    // 1. 마켓 동기화 (최초 1회는 보장 ㄱ)
    await this.ensureMarkets();

    // 2. krw 마켓의 티커 구독
    this.subscribeTickerStream();

    // 3. 메시지를 map + subject로 반영
    this.wsClient.ticker$.subscribe((raw: UpbitTickerSimpleRaw) =>
      this.handleRawTicker(raw),
    );
  }

  private async ensureMarkets() {
    if (this.marketService.hasMarkets()) {
      return;
    }

    this.logger.log('No markets cached. Running initial market sync...');
    await this.marketSyncService.syncMarket();
  }

  private subscribeTickerStream() {
    const krw = this.marketService.getKrwMarkets();

    if (krw.length === 0) {
      this.logger.warn('No KRW markets available for ticker subscription.');
      return;
    }

    const codes = krw.map((m) => m.code);

    const payload = [
      { ticket: `ticker-${Date.now()}` },
      { type: 'ticker', codes },
      { format: 'SIMPLE_LIST' },
    ];

    this.wsClient.send(payload);
  }

  private handleRawTicker(raw: UpbitTickerSimpleRaw) {
    if (!raw.cd.startsWith('KRW-')) {
      return;
    }

    const ticker = mapUpbitTickerSimpleToMarketTicker(raw);

    // map 갱신
    this.tickerMap.set(ticker.code, ticker);

    // 실시간 스트림 발행
    this.tickerSubject.next(ticker);
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
}
