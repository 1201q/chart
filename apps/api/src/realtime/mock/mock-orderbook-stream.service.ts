import { Injectable } from '@nestjs/common';
import { Observable, interval, map, share } from 'rxjs';
import { MarketOrderbook } from '@chart/shared-types';
import { MockMarketEngine } from './mock-engine';
import { getMockConfig } from 'src/common/config/mock.config';

@Injectable()
export class MockOrderbookStreamService {
  getSnapshotByCode(code: string): MarketOrderbook {
    const cfg = getMockConfig();
    const eng = new MockMarketEngine(code, cfg);
    return eng.snapshotOrderbook('SNAPSHOT' as any);
  }

  orderbookByCode$(code: string): Observable<MarketOrderbook> {
    const cfg = getMockConfig();
    const eng = new MockMarketEngine(code, cfg);

    // 연결(구독) 시작하면 tick=0부터 동일 시퀀스
    return interval(cfg.stepMs).pipe(
      map(() => eng.step().orderbook),
      share(),
    );
  }
}
