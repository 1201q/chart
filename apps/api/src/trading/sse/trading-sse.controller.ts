import { Controller, Sse } from '@nestjs/common';
import { TradingTestService } from '../trading.test.service';
import { TradingStreamService } from './trading-stream.service';
import { TradingQueryService } from './trading-query.service';
import { interval, map, merge, of } from 'rxjs';

@Controller('sse')
export class TradingSseController {
  constructor(
    private readonly testService: TradingTestService,
    private readonly stream: TradingStreamService,
    private readonly query: TradingQueryService,
  ) {}

  @Sse('trading')
  async streamTrading() {
    const userId = await this.testService.getAdminUserId();

    const snapshot = await this.query.buildSnapshot(userId);

    const snapshot$ = of({
      type: 'trading',
      data: {
        data: snapshot,
        type: 'snapshot',
      },
    });

    const events$ = this.stream.subscribe(userId).pipe(
      map((e) => ({
        type: 'trading',
        data: {
          data: e.data,
          type: e.type,
        },
      })),
    );

    const heartbeat$ = interval(15000).pipe(
      map(() => ({
        type: 'heartbeat',
        data: {
          data: 'ping',
          type: 'heartbeat',
        },
      })),
    );

    return merge(snapshot$, events$, heartbeat$);
  }
}
