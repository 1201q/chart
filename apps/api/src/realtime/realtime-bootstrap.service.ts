import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MarketService } from 'src/market/market.service';
import { MarketSyncService } from 'src/market/market.sync.service';
import { UpbitWebsocketClient } from 'src/upbit/upbit-websocket.client';
import { CandleVolumeTracker } from './candle/candle-volume-tracker.service';

import { UpbitCandleType } from '@chart/shared-types';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class RealtimeBootstrapService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RealtimeBootstrapService.name);

  private subscribedKey: string | null = null;
  private watchdogTimer?: NodeJS.Timeout;

  constructor(
    private readonly wsClient: UpbitWebsocketClient,
    private readonly marketService: MarketService,
    private readonly marketSyncService: MarketSyncService,
    private readonly candleVolumeTracker: CandleVolumeTracker,
  ) {}

  async onModuleInit() {
    await this.bootstrap();

    this.startWatchdog();
  }

  onModuleDestroy() {
    if (this.watchdogTimer) clearInterval(this.watchdogTimer);
    this.logger.log('🛑 RealtimeBootstrapService가 종료되었습니다.');
  }

  // 매일 새벽 3시에 마켓 싱크 및 재구독
  @Cron('0 3 * * *', { timeZone: 'Asia/Seoul' })
  async dailyMarketSync() {
    this.logger.log(`⏰ daily market sync start: ${new Date().toISOString()}`);

    await this.marketService.reloadMarketsFromDb();

    const { diff } = await this.marketSyncService.syncMarket();

    // 추가된 마켓 초기화
    if (diff.added && diff.added.length > 0) {
      this.logger.log(`🆕 ${diff.added.length} new markets detected - initializing...`);
      await this.candleVolumeTracker.initializeSpecificMarkets(
        diff.added.map((m) => m.code),
      );
    }

    const changed = (diff.added?.length ?? 0) > 0 || (diff.removed?.length ?? 0) > 0;

    if (!changed) {
      this.logger.log('ℹ️ 마켓 변경사항이 없어 웹소켓 재구독이 필요하지 않습니다.');
      return;
    }

    const after = await this.marketService.reloadMarketsFromDb();
    await this.subscribeWebsocket(after, {
      force: true,
      reason: 'market-changed',
      mode: 'resubscribe',
    });

    this.logger.log(
      `✅ daily market sync done: (added=${diff.added.length}, removed=${diff.removed.length})`,
    );
  }

  // ===================
  private async bootstrap() {
    let markets = await this.marketService.reloadMarketsFromDb();

    if (markets.length === 0) {
      this.logger.warn('⚠️ warning: KRW 마켓이 0개. syncMarket을 시도합니다.');
      await this.marketSyncService.syncMarket();
      markets = await this.marketService.reloadMarketsFromDb();
    }

    if (markets.length === 0) {
      this.logger.fatal(
        '❌ error: KRW 마켓이 여전히 0개입니다. 웹소켓 구독을 건너뜁니다.',
      );
      return;
    }

    await this.subscribeWebsocket(markets, {
      force: true,
      reason: 'initial-bootstrap',
      mode: 'subscribe',
    });
  }

  private async subscribeWebsocket(
    markets: { code: string }[],
    opts: { force?: boolean; reason: string; mode: 'subscribe' | 'resubscribe' },
  ) {
    const codes = markets.map((m) => m.code);

    const nextKey = codes.join(',');
    const isSameKey = this.subscribedKey === nextKey;

    if (!opts.force && isSameKey) {
      this.logger.log(
        `ℹ️ 웹소켓 구독 키가 동일합니다. 재구독을 건너뜁니다. ${opts.reason}`,
      );
      return;
    }

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

    // 재구독 시 CandleVolumeTracker 리셋
    if (opts.mode === 'resubscribe') {
      await this.candleVolumeTracker.resetForResubscription(); // ✅ async 추가
      this.wsClient.resubscribe(payload);
    } else {
      this.wsClient.subscribe(payload);
    }

    this.subscribedKey = nextKey;
  }

  private startWatchdog() {
    this.watchdogTimer = setInterval(() => {
      const h = this.wsClient.getHealthSnapshot();

      if (!this.subscribedKey) return;

      const last = h.lastMessageAt?.getTime() ?? 0;
      const now = Date.now();

      // 15 초 이상 메시지 수신이 없으면 재구독
      if (h.connected && last > 0 && now - last > 15_000) {
        this.logger.warn(
          `⚠️ watchdog: no messages for ${(now - last) / 1000}s → force resubscribe`,
        );

        this.marketService
          .reloadMarketsFromDb()
          .then((markets) =>
            this.subscribeWebsocket(markets, {
              force: true,
              reason: 'watchdog',
              mode: 'resubscribe',
            }),
          )
          .catch(() => {});
      }
    }, 10_000);
  }
}
