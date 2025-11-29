import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MarketService } from 'src/market/market.service';
import { MarketSyncService } from 'src/market/market.sync.service';
import { UpbitWebsocketClient } from 'src/upbit/upbit-websocket.client';

import { UpbitCandleType } from '@chart/shared-types';

@Injectable()
export class RealtimeBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(RealtimeBootstrapService.name);

  constructor(
    private readonly wsClient: UpbitWebsocketClient,
    private readonly marketService: MarketService,
    private readonly marketSyncService: MarketSyncService,
  ) {}

  async onModuleInit() {
    await this.marketSyncService.syncMarket();
    const markets = this.marketService.getAll();

    if (markets.length === 0) {
      this.logger.warn('⚠️ warning: KRW 마켓이 0개. 웹소켓 구독을 건너뜁니다.');
      return;
    }

    const codes = markets.map((m) => m.code);

    const candleTypes: UpbitCandleType[] = [
      'candle.1m',
      'candle.3m',
      'candle.5m',
      'candle.10m',
      'candle.15m',
      'candle.30m',
      'candle.60m',
      'candle.240m',
    ];

    // 한번에 구독
    const payload = [
      { ticket: `all-${Date.now()}` },
      { type: 'ticker', codes },
      { type: 'trade', codes },
      { type: 'orderbook', codes },
      ...candleTypes.map((t) => ({ type: t, codes })),
      { format: 'SIMPLE_LIST' },
    ];

    this.logger.verbose(`🚀 Upbit WebSocket 구독 시작: ${codes.length}개 마켓`);
    this.wsClient.subscribe(payload);
  }
}
