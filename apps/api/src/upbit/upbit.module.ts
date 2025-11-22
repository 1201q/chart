import { Module } from '@nestjs/common';
import { UpbitHttpService } from './upbit.http.service';
import { UpbitWebsocketClient } from './upbit-websocket.client';

@Module({
  providers: [UpbitHttpService, UpbitWebsocketClient],
  exports: [UpbitHttpService, UpbitWebsocketClient],
})
export class UpbitModule {}
