import { Controller, Get, Sse, MessageEvent, Param } from '@nestjs/common';
import { EMPTY, map, merge, Observable, of } from 'rxjs';

import { OrderbookStreamService } from './orderbook-stream.service';

@Controller()
export class OrderbookController {
  constructor(private readonly orderbookStream: OrderbookStreamService) {}

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
          event: 'orderbook',
          data: snapshot,
        })
      : EMPTY;

    const realtime$: Observable<MessageEvent> = this.orderbookStream
      .orderbookByCode$(upperCode)
      .pipe(map((orderbook) => ({ event: 'orderbook', data: orderbook })));

    return merge(snapshot$, realtime$);
  }
}
