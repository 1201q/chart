import { Injectable } from '@nestjs/common';
import { Observable, interval, map } from 'rxjs';
import { MarketTicker } from '@chart/shared-types';
import { MarketService } from 'src/market/market.service';
import { MockMarketEngine } from './mock-engine';
import { getMockConfig } from 'src/common/config/mock.config';

@Injectable()
export class MockTickerStreamService {
  constructor(private readonly market: MarketService) {}

  getSnapshot(): Record<string, MarketTicker> {
    const cfg = getMockConfig();
    const markets = this.market.getAll();

    const out: Record<string, MarketTicker> = {};

    for (const m of markets) {
      const eng = new MockMarketEngine(m.code, cfg);
      out[m.code] = eng.snapshotTicker();
    }
    return out;
  }

  getSnapshotByCode(code: string): MarketTicker | undefined {
    const cfg = getMockConfig();
    const eng = new MockMarketEngine(code, cfg);
    return eng.snapshotTicker();
  }

  tickerByCode$(code: string): Observable<MarketTicker> {
    const cfg = getMockConfig();
    const eng = new MockMarketEngine(code, cfg);

    return interval(cfg.stepMs).pipe(map(() => eng.step().ticker));
  }

  /**
   * 전체 tickers 스트림: round-robin으로 1개씩 방출 (결정론)
   */
  tickers$(): Observable<MarketTicker> {
    const cfg = getMockConfig();
    const markets = this.market.getAll();
    const engines = markets.map((m) => new MockMarketEngine(m.code, cfg));

    return interval(cfg.stepMs).pipe(
      map((i) => {
        const idx = i % engines.length;
        return engines[idx].step().ticker;
      }),
    );
  }
}
