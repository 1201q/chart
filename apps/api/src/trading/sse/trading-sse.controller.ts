import { Controller, Sse } from '@nestjs/common';
import { TradingStreamService } from './trading-stream.service';
import { TradingQueryService } from './trading-query.service';
import { interval, map, merge, of } from 'rxjs';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { TradingUser } from '../entities/trading-user.entity';

@Controller('sse')
export class TradingSseController {
  constructor(
    private readonly stream: TradingStreamService,
    private readonly query: TradingQueryService,
  ) {}

  @Sse('trading')
  async streamTrading(@CurrentUser() user: TradingUser) {
    const userId = user.id;

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
