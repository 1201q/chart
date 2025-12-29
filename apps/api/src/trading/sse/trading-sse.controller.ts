import { Controller, Sse } from '@nestjs/common';
import { TradingTestService } from '../trading.test.service';
import { TradingStreamService } from './trading-stream.service';
import { TradingQueryService } from './trading-query.service';
import { interval, map, merge, Observable, of } from 'rxjs';

@Controller('sse')
export class TradingSseController {
  constructor(
    private readonly testService: TradingTestService,
    private readonly stream: TradingStreamService,
    private readonly query: TradingQueryService,
  ) {}

  @Sse('trading')
  async streamTrading(): Promise<Observable<MessageEvent>> {
    const userId = await this.testService.getAdminUserId();

    const snapshot = await this.query.buildSnapshot(userId);

    const snapshot$ = of({
      event: 'trading',
      type: 'snapshot',
      data: snapshot,
    });

    const events$ = this.stream.subscribe(userId);
    const heartbeat$ = interval(15000).pipe(
      map(() => ({
        event: 'heartbeat',
        type: 'heartbeat',
        data: 'ping',
      })),
    );

    return merge(snapshot$, events$, heartbeat$).pipe(
      map((e) => ({ type: e.type, data: e.data }) as MessageEvent),
    );
  }
}
