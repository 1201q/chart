import {
  MarketOrderbook,
  UpbitOrderbookSimpleRaw,
  mapUpbitOrderbookSimpleToMarketOrderbook,
} from '@chart/shared-types';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Subject, Observable, filter } from 'rxjs';

import { UpbitWebsocketClient } from 'src/upbit/upbit-websocket.client';

@Injectable()
export class OrderbookStreamService implements OnModuleInit {
  private readonly logger = new Logger(OrderbookStreamService.name);

  private readonly orderbookSubject = new Subject<MarketOrderbook>();
  private readonly orderbookMap = new Map<string, MarketOrderbook>();

  private lastMessageAt: Date | null = null;
  private totalMessages = 0;

  constructor(private readonly wsClient: UpbitWebsocketClient) {}

  async onModuleInit() {
    // 메시지를 map + subject로 반영
    this.wsClient.orderbook$.subscribe((raw: UpbitOrderbookSimpleRaw) =>
      this.handleRawOrderbook(raw),
    );
  }

  private handleRawOrderbook(raw: UpbitOrderbookSimpleRaw) {
    if (!raw.cd.startsWith('KRW-')) return;

    const orderbook = mapUpbitOrderbookSimpleToMarketOrderbook(raw);
    const code = orderbook.code.toUpperCase();

    // map 갱신
    this.orderbookMap.set(code, orderbook);

    // 실시간 스트림 발행
    this.orderbookSubject.next(orderbook);

    this.lastMessageAt = new Date();
    this.totalMessages += 1;
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
    return this.orderbooks$().pipe(filter((o) => o.code.toUpperCase() === upperCode));
  }

  getHealthSnapshot() {
    return {
      lastMessageAt: this.lastMessageAt,
      totalMessages: this.totalMessages,
      codes: this.orderbookMap.size,
    };
  }
}
