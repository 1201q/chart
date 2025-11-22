import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { WebSocket } from 'ws';
import { Subject } from 'rxjs';

@Injectable()
export class UpbitWebsocketClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UpbitWebsocketClient.name);

  private ws?: WebSocket;
  private reconnecting = false;
  private isOpen = false;

  private readonly pendingPayloads: any[] = [];

  public readonly ticker$ = new Subject<any>();

  onModuleInit() {
    this.connect();
  }

  onModuleDestroy() {
    this.ws?.close();
    this.ticker$.complete();
  }

  private connect() {
    this.logger.log('Connecting to Upbit WebSocket...');

    this.ws = new WebSocket('wss://api.upbit.com/websocket/v1');

    this.ws.on('open', () => {
      this.logger.debug('Connected to Upbit WebSocket');
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
        const msg = Array.isArray(parsed) ? parsed[0] : parsed;

        switch (msg.ty ?? msg.type) {
          case 'ticker':
            this.ticker$.next(msg);
            break;
          default:
            this.logger.warn(`Unknown message type: ${msg.ty ?? msg.type}`);
        }
      } catch (error) {
        this.logger.error('Error parsing message', error as Error);
      }
    });

    this.ws.on('close', () => {
      this.logger.warn('Upbit WebSocket connection closed.');
      this.isOpen = false;
      this.scheduleReconnect();
    });

    this.ws.on('error', (error) => {
      this.logger.error('Upbit WebSocket error', error as Error);
      this.isOpen = false;
      this.scheduleReconnect();
    });
  }

  private scheduleReconnect() {
    if (this.reconnecting) return;
    this.reconnecting = true;

    setTimeout(() => {
      this.reconnecting = false;
      this.logger.log('Reconnecting to Upbit WebSocket...');
      this.connect();
    }, 3000);
  }

  private _sendNow(payload: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.logger.warn('WebSocket not open. Cannot send message.');
      return;
    }

    this.ws.send(JSON.stringify(payload));
  }

  public send(payload: any) {
    if (!this.isOpen || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.logger.debug(
        `WebSocket not ready. Queueing payload: ${JSON.stringify(payload)}`,
      );
      this.pendingPayloads.push(payload);
      return;
    }

    this._sendNow(payload);
  }
}
