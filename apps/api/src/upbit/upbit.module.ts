import { Module } from '@nestjs/common';
import { UpbitHttpService } from './upbit.http.service';
import { UpbitWebsocketClient } from './upbit-websocket.client';
import { UpbitRateLimiter } from './upbit-rate-limiter.service';

@Module({
  providers: [UpbitHttpService, UpbitWebsocketClient, UpbitRateLimiter],
  exports: [UpbitHttpService, UpbitWebsocketClient],
})
export class UpbitModule {}
