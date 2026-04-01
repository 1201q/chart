import { Body, Controller, Get, MessageEvent, Param, Post, Sse } from '@nestjs/common';
import { EMPTY, interval, map, merge, Observable, of } from 'rxjs';

import { OrderbookStreamService } from './orderbook-stream.service';
import { OrderbookReplayService, ReplayEvent } from './orderbook-replay.service';
import { Public } from 'src/auth/decorators/public.decorator';

@Public()
@Controller()
export class OrderbookController {
  constructor(
    private readonly orderbookStream: OrderbookStreamService,
    private readonly orderbookReplay: OrderbookReplayService,
  ) {}

  @Get(`orderbook/:code`)
  getOrderbookSnapshot(@Param('code') code: string) {
    const upperCode = decodeURIComponent(code).toUpperCase();
    return this.orderbookStream.getSnapshotByCode(upperCode);
  }

  @Sse(`sse/orderbook/:code`)
  streamOrderbookByCode(@Param('code') code: string): Observable<MessageEvent> {
    const upperCode = decodeURIComponent(code).toUpperCase();

    const snapshot = this.orderbookStream.getSnapshotByCode(upperCode);

    const snapshot$: Observable<MessageEvent> = snapshot
      ? of({
          type: 'snapshot',
          data: snapshot,
        })
      : EMPTY;

    const realtime$: Observable<MessageEvent> = this.orderbookStream
      .orderbookByCode$(upperCode)
      .pipe(
        map((orderbook) => ({
          type: 'realtime',
          data: orderbook,
        })),
      );

    const heartbeat$: Observable<MessageEvent> = interval(15000).pipe(
      map(() => ({
        type: 'heartbeat',
        data: 'ping',
      })),
    );

    return merge(snapshot$, realtime$, heartbeat$);
  }

  // 녹화된 SSE 이벤트를 저장하고 세션 ID 반환
  @Post('sse/orderbook-replay')
  storeReplay(@Body() body: { events: ReplayEvent[] }): { id: string } {
    const id = this.orderbookReplay.store(body.events);
    return { id };
  }

  // 저장된 세션을 동일한 타이밍으로 재생
  @Sse('sse/orderbook-replay/:id')
  streamReplay(@Param('id') id: string): Observable<MessageEvent> {
    const replay$ = this.orderbookReplay.replay$(id);
    if (!replay$) return EMPTY;

    const heartbeat$: Observable<MessageEvent> = interval(15000).pipe(
      map(() => ({ type: 'heartbeat', data: 'ping' })),
    );

    return merge(replay$, heartbeat$);
  }
}
