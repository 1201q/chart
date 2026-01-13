import { Injectable } from '@nestjs/common';
import { Observable, interval, map } from 'rxjs';
import { MarketTradeWithId } from '@chart/shared-types';
import { MockMarketEngine } from './mock-engine';
import { getMockConfig } from 'src/common/config/mock.config';

@Injectable()
export class MockTradeStreamService {
  getRecentTrades(code: string): MarketTradeWithId[] {
    const cfg = getMockConfig();
    const eng = new MockMarketEngine(code, cfg);
    return eng.snapshotTrades(cfg.tradesSnapshotCount);
  }

  tradesByCode$(code: string): Observable<MarketTradeWithId> {
    const cfg = getMockConfig();
    const eng = new MockMarketEngine(code, cfg);

    return interval(cfg.stepMs).pipe(map(() => eng.step().trade));
  }
}
