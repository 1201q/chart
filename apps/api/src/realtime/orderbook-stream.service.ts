import {
  MarketOrderbook,
  UpbitOrderbookSimpleRaw,
  mapUpbitOrderbookSimpleToMarketOrderbook,
} from '@chart/shared-types';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Subject, Observable, filter } from 'rxjs';

import { MarketService } from 'src/market/market.service';
import { MarketSyncService } from 'src/market/market.sync.service';
import { UpbitWebsocketClient } from 'src/upbit/upbit-websocket.client';

@Injectable()
export class OrderbookStreamService implements OnModuleInit {
  private readonly logger = new Logger(OrderbookStreamService.name);

  private readonly orderbookSubject = new Subject<MarketOrderbook>();
  private readonly orderbookMap = new Map<string, MarketOrderbook>();

  constructor(
    private readonly wsClient: UpbitWebsocketClient,
    private readonly marketService: MarketService,
    private readonly marketSyncService: MarketSyncService,
  ) {}

  async onModuleInit() {
    // 1. 마켓 동기화 (최초 1회는 보장 ㄱ)
    await this.ensureMarkets();

    // 2. krw 마켓의 trade 구독
    this.subscribeOrderbookStream();

    // 3. 메시지를 map + subject로 반영
    this.wsClient.orderbook$.subscribe((raw: UpbitOrderbookSimpleRaw) =>
      this.handleRawOrderbook(raw),
    );
  }

  private async ensureMarkets() {
    if (this.marketService.hasMarkets()) {
      return;
    }

    await this.marketSyncService.syncMarket();
  }

  private subscribeOrderbookStream() {
    const krw = this.marketService.getAll();

    if (krw.length === 0) {
      this.logger.warn(
        '⚠️ warning: KRW 마켓이 0개. 없습니다. orderbook 구독을 건너뜁니다.',
      );
      return;
    }

    const codes = krw.map((m) => m.code);

    const payload = [
      { ticket: `orderbook-${Date.now()}` },
      { type: 'orderbook', codes },
      { format: 'SIMPLE_LIST' },
    ];

    this.wsClient.send(payload);
  }

  private handleRawOrderbook(raw: UpbitOrderbookSimpleRaw) {
    if (!raw.cd.startsWith('KRW-')) {
      return;
    }

    const orderbook = mapUpbitOrderbookSimpleToMarketOrderbook(raw);
    const code = orderbook.code.toUpperCase();

    // map 갱신
    this.orderbookMap.set(code, orderbook);

    // 실시간 스트림 발행
    this.orderbookSubject.next(orderbook);
  }

  // 특정 코드의 스냅샷 반환
  getSnapshotByCode(code: string): MarketOrderbook | null {
    const upperCode = code.toUpperCase();
    return this.orderbookMap.get(upperCode) ?? null;
  }

  orderbooks$(): Observable<MarketOrderbook> {
    return this.orderbookSubject.asObservable();
  }

  orderbookByCode$(code: string): Observable<MarketOrderbook> {
    const upperCode = code.toUpperCase();
    return this.orderbooks$().pipe(
      filter((o) => o.code.toUpperCase() === upperCode),
    );
  }
}
