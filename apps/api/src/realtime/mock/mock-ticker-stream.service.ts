import { Injectable } from '@nestjs/common';
import { Observable, interval, map } from 'rxjs';
import { MarketTicker } from '@chart/shared-types';
import { MarketService } from 'src/market/market.service';
import { MockMarketEngine } from './mock-engine';
import { getMockConfig } from 'src/common/config/mock.config';

function hash32(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function buildLiquidityByCode(
  codes: string[],
  min = 1e8, // 1억
  max = 4.5e11, // 4500억
  gamma = 1.8,
) {
  // 결정론 rank 부여: hash로 정렬
  const sorted = [...codes].sort((a, b) => hash32(a) - hash32(b));
  const N = sorted.length;

  const out: Record<string, number> = {};
  for (let i = 0; i < N; i++) {
    const x = N === 1 ? 0 : i / (N - 1);
    const t = Math.pow(x, gamma);
    const v = Math.floor(max * Math.pow(min / max, t)); // max -> min
    out[sorted[i]] = v;
  }
  return out;
}

@Injectable()
export class MockTickerStreamService {
  constructor(private readonly market: MarketService) {}

  // 캐시: snapshot/stream 모두 동일 분포 사용
  private cachedScenario: string | null = null;
  private cachedLiquidityByCode: Record<string, number> | null = null;

  private getLiquidityByCode() {
    const cfg = getMockConfig();
    const scenario = cfg.scenario;

    if (this.cachedLiquidityByCode && this.cachedScenario === scenario) {
      return this.cachedLiquidityByCode;
    }

    const markets = this.market.getAll();
    const codes = markets.map((m) => m.code);

    const liquidityByCode = buildLiquidityByCode(codes, 1e8, 4.5e11, 1.8);

    this.cachedScenario = scenario;
    this.cachedLiquidityByCode = liquidityByCode;

    return liquidityByCode;
  }

  getSnapshot(): Record<string, MarketTicker> {
    const cfg = getMockConfig();
    const markets = this.market.getAll();
    const liquidityByCode = this.getLiquidityByCode();

    const out: Record<string, MarketTicker> = {};
    for (const m of markets) {
      const eng = new MockMarketEngine(m.code, { ...cfg, liquidityByCode });
      out[m.code] = eng.snapshotTicker();
    }
    return out;
  }

  getSnapshotByCode(code: string): MarketTicker | undefined {
    const cfg = getMockConfig();
    const liquidityByCode = this.getLiquidityByCode();

    const eng = new MockMarketEngine(code, { ...cfg, liquidityByCode });
    return eng.snapshotTicker();
  }

  tickerByCode$(code: string): Observable<MarketTicker> {
    const cfg = getMockConfig();
    const liquidityByCode = this.getLiquidityByCode();

    const eng = new MockMarketEngine(code, { ...cfg, liquidityByCode });
    return interval(cfg.stepMs).pipe(map(() => eng.step().ticker));
  }

  /**
   * 전체 tickers 스트림: round-robin으로 1개씩 방출 (결정론)
   */
  tickers$(): Observable<MarketTicker> {
    const cfg = getMockConfig();
    const markets = this.market.getAll();
    const liquidityByCode = this.getLiquidityByCode();

    const engines = markets.map(
      (m) => new MockMarketEngine(m.code, { ...cfg, liquidityByCode }),
    );

    return interval(cfg.stepMs).pipe(
      map((i) => {
        const idx = i % engines.length;
        return engines[idx].step().ticker;
      }),
    );
  }
}
