import { Injectable, Logger } from '@nestjs/common';
import { MarketService } from 'src/market/market.service';

import { UpbitWebsocketClient } from 'src/upbit/upbit-websocket.client';

import { TickerStreamService } from '../ticker/ticker-stream.service';
import { TradeStreamService } from '../trade/trade-stream.service';
import { OrderbookStreamService } from '../orderbook/orderbook-stream.service';
import { CandleStreamService } from '../candle/candle-stream.service';

@Injectable()
export class RealtimeHealthService {
  private readonly logger = new Logger(RealtimeHealthService.name);

  constructor(
    private readonly wsClient: UpbitWebsocketClient,
    private readonly marketService: MarketService,
    private readonly tickerStream: TickerStreamService,
    private readonly tradeStream: TradeStreamService,
    private readonly orderbookStream: OrderbookStreamService,
    private readonly candleStream: CandleStreamService,
  ) {}

  getHealth() {
    const ws = this.wsClient.getHealthSnapshot(); // 웹소켓 상태
    const markets = this.marketService.getAll(); // KRW 마켓 개수

    // 각 스트림 상태
    const tickerHealth = this.tickerStream.getHealthSnapshot();
    const tradeHealth = this.tradeStream.getHealthSnapshot();
    const orderbookHealth = this.orderbookStream.getHealthSnapshot();
    const candleHealth = this.candleStream.getHealthSnapshot();

    const now = Date.now();
    const TIME_OUT = 15_000; // 15초

    const isWsAlive = ws.connected && !!ws.lastMessageAt;
    const isTickerAlive =
      tickerHealth.lastMessageAt &&
      now - tickerHealth.lastMessageAt.getTime() < TIME_OUT;
    const isTradeAlive =
      tradeHealth.lastMessageAt &&
      now - tradeHealth.lastMessageAt.getTime() < TIME_OUT;
    const isOrderbookAlive =
      orderbookHealth.lastMessageAt &&
      now - orderbookHealth.lastMessageAt.getTime() < TIME_OUT;
    const isCandleAlive =
      candleHealth.lastMessageAt &&
      now - candleHealth.lastMessageAt.getTime() < TIME_OUT;

    const overallStatus =
      isWsAlive &&
      isCandleAlive &&
      isOrderbookAlive &&
      isTickerAlive &&
      isTradeAlive
        ? 'ok'
        : 'degraded';

    return {
      status: overallStatus,
      websocket: ws,
      marketCount: markets.length,
      streams: {
        ticker: tickerHealth,
        trade: tradeHealth,
        orderbook: orderbookHealth,
        candle: candleHealth,
      },
    };
  }
}
