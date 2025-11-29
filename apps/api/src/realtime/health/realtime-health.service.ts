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
    const TIME_OUT = 15_000; // 15초 이상 메시지 없으면 비정상으로 간주

    const isWsReceiving =
      ws.lastMessageAt && now - ws.lastMessageAt.getTime() < TIME_OUT;
    const isTickerReceiving =
      tickerHealth.lastMessageAt &&
      now - tickerHealth.lastMessageAt.getTime() < TIME_OUT;
    const isTradeReceiving =
      tradeHealth.lastMessageAt &&
      now - tradeHealth.lastMessageAt.getTime() < TIME_OUT;
    const isOrderbookReceiving =
      orderbookHealth.lastMessageAt &&
      now - orderbookHealth.lastMessageAt.getTime() < TIME_OUT;
    const isCandleReceiving =
      candleHealth.lastMessageAt &&
      now - candleHealth.lastMessageAt.getTime() < TIME_OUT;

    let overallStatus: 'ok' | 'degraded' | 'down' = 'ok';
    const reasons: string[] = [];

    if (!ws.connected) {
      overallStatus = 'down';
      reasons.push('WebSocket disconnected');
    }

    if (!isWsReceiving) {
      overallStatus = 'degraded';
      reasons.push('No messages received from WebSocket');
    }

    if (!isTickerReceiving) {
      overallStatus = 'degraded';
      reasons.push('No messages received from Ticker stream');
    }

    if (!isTradeReceiving) {
      overallStatus = 'degraded';
      reasons.push('No messages received from Trade stream');
    }

    if (!isOrderbookReceiving) {
      overallStatus = 'degraded';
      reasons.push('No messages received from Orderbook stream');
    }

    if (!isCandleReceiving) {
      overallStatus = 'degraded';
      reasons.push('No messages received from Candle stream');
    }

    return {
      status: overallStatus,
      reasons,
      websocket: {
        ...ws,
        isReceiving: isWsReceiving,
      },
      marketCount: markets.length,
      streams: {
        ticker: { ...tickerHealth, isReceiving: isTickerReceiving },
        trade: { ...tradeHealth, isReceiving: isTradeReceiving },
        orderbook: { ...orderbookHealth, isReceiving: isOrderbookReceiving },
        candle: { ...candleHealth, isReceiving: isCandleReceiving },
      },
    };
  }
}
