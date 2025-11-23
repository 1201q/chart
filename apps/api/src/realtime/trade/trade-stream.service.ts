import {
  MarketTrade,
  UpbitTradeSimpleRaw,
  mapUpbitTradeSimpleToMarketTrade,
} from '@chart/shared-types';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Subject, Observable, filter } from 'rxjs';

import { UpbitWebsocketClient } from 'src/upbit/upbit-websocket.client';

const MAX_TRADES_PER_CODE = 50;

@Injectable()
export class TradeStreamService implements OnModuleInit {
  private readonly logger = new Logger(TradeStreamService.name);

  private readonly tradeSubject = new Subject<MarketTrade>();
  private readonly tradeHistory = new Map<string, MarketTrade[]>();

  private lastMessageAt: Date | null = null;
  private totalMessages = 0;

  constructor(private readonly wsClient: UpbitWebsocketClient) {}

  async onModuleInit() {
    // 메시지를 map + subject로 반영
    this.wsClient.trade$.subscribe((raw: UpbitTradeSimpleRaw) =>
      this.handleRawTrade(raw),
    );
  }

  private handleRawTrade(raw: UpbitTradeSimpleRaw) {
    if (!raw.cd.startsWith('KRW-')) return;

    const trade = mapUpbitTradeSimpleToMarketTrade(raw);
    const code = trade.code.toUpperCase();

    // 히스토리 갱신
    const list = this.tradeHistory.get(code) ?? [];
    list.push(trade);

    if (list.length > MAX_TRADES_PER_CODE) {
      list.splice(0, list.length - MAX_TRADES_PER_CODE);
    }

    // map 갱신
    this.tradeHistory.set(code, list);

    // 실시간 스트림 발행
    this.tradeSubject.next(trade);

    this.lastMessageAt = new Date();
    this.totalMessages += 1;
  }

  trades$(): Observable<MarketTrade> {
    return this.tradeSubject.asObservable();
  }

  tradesByCode$(code: string): Observable<MarketTrade> {
    const upperCode = code.toUpperCase();
    return this.trades$().pipe(
      filter((trade) => trade.code.toUpperCase() === upperCode),
    );
  }

  getRecentTrades(code: string): MarketTrade[] {
    const upperCode = code.toUpperCase();
    return this.tradeHistory.get(upperCode) ?? [];
  }

  getHealthSnapshot() {
    return {
      lastMessageAt: this.lastMessageAt,
      totalMessages: this.totalMessages,
      codes: this.tradeHistory.size,
    };
  }
}
