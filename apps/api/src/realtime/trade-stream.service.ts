import {
  MarketTrade,
  UpbitTradeSimpleRaw,
  mapUpbitTradeSimpleToMarketTrade,
} from '@chart/shared-types';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Subject, Observable, filter } from 'rxjs';

import { MarketService } from 'src/market/market.service';
import { MarketSyncService } from 'src/market/market.sync.service';
import { UpbitWebsocketClient } from 'src/upbit/upbit-websocket.client';

const MAX_TRADES_PER_CODE = 50;

@Injectable()
export class TradeStreamService implements OnModuleInit {
  private readonly logger = new Logger(TradeStreamService.name);

  private readonly tradeSubject = new Subject<MarketTrade>();
  private readonly tradeHistory = new Map<string, MarketTrade[]>();

  constructor(
    private readonly wsClient: UpbitWebsocketClient,
    private readonly marketService: MarketService,
    private readonly marketSyncService: MarketSyncService,
  ) {}

  async onModuleInit() {
    // 1. 마켓 동기화 (최초 1회는 보장 ㄱ)
    await this.ensureMarkets();

    // 2. krw 마켓의 trade 구독
    this.subscribeTradeStream();

    // 3. 메시지를 map + subject로 반영
    this.wsClient.trade$.subscribe((raw: UpbitTradeSimpleRaw) =>
      this.handleRawTrade(raw),
    );
  }

  private async ensureMarkets() {
    if (this.marketService.hasMarkets()) {
      return;
    }

    await this.marketSyncService.syncMarket();
  }

  private subscribeTradeStream() {
    const krw = this.marketService.getAll();

    if (krw.length === 0) {
      this.logger.warn(
        '⚠️ warning: KRW 마켓이 0개. 없습니다. trade 구독을 건너뜁니다.',
      );
      return;
    }

    const codes = krw.map((m) => m.code);

    const payload = [
      { ticket: `trade-${Date.now()}` },
      { type: 'trade', codes },
      { format: 'SIMPLE_LIST' },
    ];

    this.wsClient.send(payload);
  }

  private handleRawTrade(raw: UpbitTradeSimpleRaw) {
    if (!raw.cd.startsWith('KRW-')) {
      return;
    }

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
}
