import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { WebSocket } from 'ws';
import { Subject } from 'rxjs';
import {
  UpbitCandleSimpleRaw,
  UpbitOrderbookSimpleRaw,
  UpbitTickerSimpleRaw,
  UpbitTradeSimpleRaw,
} from '@chart/shared-types';

@Injectable()
export class UpbitWebsocketClient implements OnModuleDestroy {
  private readonly logger = new Logger(UpbitWebsocketClient.name);

  private ws?: WebSocket;
  private isOpen = false;

  private reconnecting = false;
  private reconnectTimer?: NodeJS.Timeout;

  private lastSubscriptionPayload: any | null = null;

  // 의도적으로 닫는 경우(재구독) 재연결 막기
  private manualClose = false;

  // 스트림 Observables
  public readonly ticker$ = new Subject<UpbitTickerSimpleRaw>();
  public readonly trade$ = new Subject<UpbitTradeSimpleRaw>();
  public readonly orderbook$ = new Subject<UpbitOrderbookSimpleRaw>();
  public readonly candle$ = new Subject<UpbitCandleSimpleRaw>();

  // 헬스 체크용
  private lastMessageAt: Date | null = null;
  private lastErrorAt: Date | null = null;
  private totalMessages = 0;

  onModuleDestroy() {
    this.manualClose = true;

    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    this.ws?.close();

    this.ticker$.complete();
    this.trade$.complete();
    this.orderbook$.complete();
    this.candle$.complete();
  }

  // 헬스 체크
  getHealthSnapshot() {
    return {
      connected: this.isOpen,
      reconnecting: this.reconnecting,
      lastMessageAt: this.lastMessageAt,
      lastErrorAt: this.lastErrorAt,
      totalMessages: this.totalMessages,
      readyState: this.ws?.readyState ?? null,
    };
  }

  private connect() {
    // 이미 연결중/ 열림중이면 방지
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.CONNECTING ||
        this.ws.readyState === WebSocket.OPEN)
    ) {
      this.logger.warn('⚠️ warning: 업비트 웹소켓이 이미 연결중이거나 열려있음');
      return;
    }

    this.logger.log('⏳ connecting: 업비트 웹소켓을 여는 중');
    this.ws = new WebSocket('wss://api.upbit.com/websocket/v1');

    this.ws.on('open', () => {
      this.logger.debug('✅ success: 업비트 웹소켓 연결 성공');
      this.isOpen = true;

      // 마지막 구독 payload가 존재한다면 재전송
      if (this.lastSubscriptionPayload) {
        this._sendNow(this.lastSubscriptionPayload);
      }
    });

    this.ws.on('message', (raw) => {
      try {
        const json = raw.toString('utf-8');

        // 반환 [{....}]
        const parsed = JSON.parse(json);
        const messages = Array.isArray(parsed) ? parsed : [parsed];

        for (const msg of messages) {
          this.lastMessageAt = new Date();
          this.totalMessages += 1;
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
        this.lastErrorAt = new Date();
        this.logger.error('🚨 fail: 메시지를 파싱하는데 실패', error as Error);
      }
    });

    this.ws.on('close', (error) => {
      this.logger.debug(error);
      this.logger.warn('⚠️ warning: 업비트 웹소켓 연결이 종료됨');
      this.isOpen = false;
      this.lastErrorAt = new Date();

      // 일부로 닫는 경우는 재연결 시도 금지
      if (this.manualClose) {
        this.manualClose = false;
        this.ws = undefined;
        return;
      }

      this.ws = undefined;
      this.scheduleReconnect();
    });

    this.ws.on('error', (error) => {
      this.logger.fatal('❌ error: 업비트 웹소켓에서 error', error as Error);
      this.lastErrorAt = new Date();
      this.isOpen = false;
      // this.scheduleReconnect();  error 이벤트뒤에 close 이벤트 동작
    });
  }

  private scheduleReconnect() {
    if (this.reconnecting) return;
    this.reconnecting = true;

    this.reconnectTimer = setTimeout(() => {
      this.reconnecting = false;
      this.reconnectTimer = undefined;
      this.logger.debug(`🔄 reconnecting: 업비트 웹소켓에 재연결 시도`);
      this.connect();
    }, 5000);
  }

  private _sendNow(payload: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.logger.warn('⚠️ warning: 웹소켓이 열려있지 않아 페이로드 전송 불가');
      return;
    }

    this.logger.verbose(`➡️ send: ${JSON.stringify(payload).slice(0, 100)}... 전송`);
    this.ws.send(JSON.stringify(payload));
  }

  // 최초 구독. 연결이 열려있다면 전송만.
  public subscribe(payload: any) {
    this.lastSubscriptionPayload = payload;

    // 연결이 안됐다면, connect.
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.connect();
      return;
    }

    this.connect();
  }

  // 마켓 변경 시 구독 교체
  public resubscribe(payload: any) {
    this.lastSubscriptionPayload = payload;

    // 이미 열려있으면 “구독 교체”를 위해 close 후 connect

    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      this.manualClose = true;

      try {
        this.ws.close();
      } catch {
        this.logger.warn('⚠️ warning: 기존 소켓 종료 중 에러 발생');
      }

      // close가 되지 않았다면 강제 종료 후 재연결
      setTimeout(() => {
        this.connect();
      }, 200);

      return;
    }
    this.connect();
  }
}
