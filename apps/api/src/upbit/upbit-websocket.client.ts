import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { WebSocket } from 'ws';
import { Subject } from 'rxjs';
import {
  UpbitCandleSimpleRaw,
  UpbitOrderbookSimpleRaw,
  UpbitTickerSimpleRaw,
  UpbitTradeSimpleRaw,
} from '@chart/shared-types';

@Injectable()
export class UpbitWebsocketClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UpbitWebsocketClient.name);

  private ws?: WebSocket;
  private reconnecting = false;
  private isOpen = false;

  private readonly pendingPayloads: any[] = [];

  public readonly ticker$ = new Subject<UpbitTickerSimpleRaw>();
  public readonly trade$ = new Subject<UpbitTradeSimpleRaw>();
  public readonly orderbook$ = new Subject<UpbitOrderbookSimpleRaw>();
  public readonly candle$ = new Subject<UpbitCandleSimpleRaw>();

  onModuleInit() {
    this.connect();
  }

  onModuleDestroy() {
    this.ws?.close();
    this.ticker$.complete();
    this.trade$.complete();
    this.orderbook$.complete();
    this.candle$.complete();
  }

  private connect() {
    this.logger.log('⏳ connecting: 업비트 웹소켓을 여는 중');

    this.ws = new WebSocket('wss://api.upbit.com/websocket/v1');

    this.ws.on('open', () => {
      this.logger.debug('✅ success: 업비트 웹소켓 연결 성공');
      this.isOpen = true;

      // 대기중이던 구독 payload flush
      while (this.pendingPayloads.length > 0) {
        const payload = this.pendingPayloads.shift();
        this._sendNow(payload);
      }
    });

    this.ws.on('message', (raw) => {
      try {
        const json = raw.toString('utf-8');

        // 반환 [{....}]
        const parsed = JSON.parse(json);
        const messages = Array.isArray(parsed) ? parsed : [parsed];

        for (const msg of messages) {
          const type = msg.ty ?? msg.type;

          // candle 메시지 먼저 처리
          if (typeof type === 'string' && type.startsWith('candle.')) {
            this.candle$.next(msg as UpbitCandleSimpleRaw);
            continue;
          }

          switch (type) {
            case 'ticker': {
              this.ticker$.next(msg as UpbitTickerSimpleRaw);
              break;
            }
            case 'trade':
              this.trade$.next(msg as UpbitTradeSimpleRaw);
              break;
            case 'orderbook':
              this.orderbook$.next(msg as UpbitOrderbookSimpleRaw);
              break;
            default:
              this.logger.warn(
                `⚠️ warning: 해당 타입 메시지를 파싱하는데 실패 ${msg.ty ?? msg.type}`,
              );
          }
        }
      } catch (error) {
        this.logger.error('🚨 fail: 메시지를 파싱하는데 실패', error as Error);
      }
    });

    this.ws.on('close', () => {
      this.logger.warn('⚠️ warning: 업비트 웹소켓 연결이 종료됨');
      this.isOpen = false;
      this.scheduleReconnect();
    });

    this.ws.on('error', (error) => {
      this.logger.fatal('❌ error: 업비트 웹소켓에서 error', error as Error);
      this.isOpen = false;
      this.scheduleReconnect();
    });
  }

  private scheduleReconnect() {
    if (this.reconnecting) return;
    this.reconnecting = true;

    setTimeout(() => {
      this.reconnecting = false;
      this.logger.debug(`🔄 reconnecting: 업비트 웹소켓에 재연결 시도`);
      this.connect();
    }, 5000);
  }

  private _sendNow(payload: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.logger.warn('⚠️ warning: 웹소켓이 열려있지 않아 페이로드 전송 불가');
      return;
    }

    this.logger.verbose(
      `✅ success: ${JSON.stringify(payload).slice(0, 100)}... 전송`,
    );
    this.ws.send(JSON.stringify(payload));
  }

  public send(payload: any) {
    if (!this.isOpen || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.logger.warn(
        `⚠️ warning: 웹소켓이 열려있지 않아 해당 페이로드를 대기열에 추가: ${JSON.stringify(payload).slice(0, 100)}...`,
      );
      this.pendingPayloads.push(payload);
      return;
    }

    this._sendNow(payload);
  }
}
