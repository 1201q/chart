import {
  CandlestickData,
  HistogramData,
  HistogramSeries,
  IChartApi,
  LineData,
  LineSeries,
  PriceLineOptions,
  Time,
} from 'lightweight-charts';

import { BandsIndicator } from './indicators/bands-indicator';
import { CloudPoint, IchimokuCloudIndicator } from './indicators/ichimoku-cloud';
import {
  BollingerConfig,
  EmaConfig,
  EnvelopeConfig,
  IchimokuConfig,
  IndicatorOptions,
  IndicatorSource,
  MacdConfig,
  RsiConfig,
  SmaConfig,
  UpperIndicatorConfig,
  VolumeConfig,
} from './indicatorTypes';

type LineSeriesApi = ReturnType<IChartApi['addSeries']>;
type HistogramSeriesApi = ReturnType<IChartApi['addSeries']>;

export type CandleIndicatorManagerV2 = {
  apply(
    candles: CandlestickData[],
    options: IndicatorOptions,
    volumes: HistogramData[],
  ): void;
  dispose(): void;
};

// ==========================================
// 계산 함수
// ==========================================

function getSourceValue(c: CandlestickData, source: IndicatorSource): number {
  switch (source) {
    case 'open':
      return c.open;
    case 'high':
      return c.high;
    case 'low':
      return c.low;
    case 'close':
    default:
      return c.close;
  }
}

export function calcSmaV2(
  candles: CandlestickData[],
  period: number,
  source: IndicatorSource = 'close',
): LineData[] {
  if (!candles.length || period <= 0) return [];
  const result: LineData[] = [];
  let sum = 0;
  const values = candles.map((c) => getSourceValue(c, source));
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) {
      result.push({ time: candles[i].time, value: sum / period });
    }
  }
  return result;
}

export function calcEma(
  candles: CandlestickData[],
  period: number,
  source: IndicatorSource = 'close',
): LineData[] {
  if (candles.length < period || period <= 0) return [];
  const k = 2 / (period + 1);
  let ema = getSourceValue(candles[period - 1], source);
  const result: LineData[] = [{ time: candles[period - 1].time, value: ema }];
  for (let i = period; i < candles.length; i++) {
    ema = getSourceValue(candles[i], source) * k + ema * (1 - k);
    result.push({ time: candles[i].time, value: ema });
  }
  return result;
}

export function calcRsi(candles: CandlestickData[], period = 14): LineData[] {
  if (candles.length <= period || period <= 0) return [];
  const closes = candles.map((c) => c.close);
  const result: LineData[] = [];
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) avgGain += diff;
    else avgLoss += -diff;
  }
  avgGain /= period;
  avgLoss /= period;
  result.push({
    time: candles[period].time,
    value: avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss),
  });
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period;
    result.push({
      time: candles[i].time,
      value: avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss),
    });
  }
  return result;
}

export function calcMacd(
  candles: CandlestickData[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): { macd: LineData[]; signal: LineData[]; histogram: HistogramData[] } {
  const empty = { macd: [], signal: [], histogram: [] };
  if (candles.length < slowPeriod + signalPeriod) return empty;
  const fastEma = calcEma(candles, fastPeriod);
  const slowEma = calcEma(candles, slowPeriod);
  const fastMap = new Map<number, number>(
    fastEma.map((d) => [d.time as number, d.value]),
  );
  const macdRaw: LineData[] = [];
  for (const s of slowEma) {
    const f = fastMap.get(s.time as number);
    if (f !== undefined) macdRaw.push({ time: s.time, value: f - s.value });
  }
  if (macdRaw.length < signalPeriod) return empty;
  const k = 2 / (signalPeriod + 1);
  let sigEma = macdRaw[signalPeriod - 1].value;
  const signalRaw: LineData[] = [{ time: macdRaw[signalPeriod - 1].time, value: sigEma }];
  for (let i = signalPeriod; i < macdRaw.length; i++) {
    sigEma = macdRaw[i].value * k + sigEma * (1 - k);
    signalRaw.push({ time: macdRaw[i].time, value: sigEma });
  }
  const sigMap = new Map<number, number>(
    signalRaw.map((d) => [d.time as number, d.value]),
  );
  const histRaw: HistogramData[] = [];
  for (const m of macdRaw) {
    const sig = sigMap.get(m.time as number);
    if (sig !== undefined) {
      const val = m.value - sig;
      histRaw.push({
        time: m.time,
        value: val,
        color: val >= 0 ? 'rgba(239,83,80,0.7)' : 'rgba(38,166,154,0.7)',
      });
    }
  }
  const signalStart = signalRaw[0].time as number;
  return {
    macd: macdRaw.filter((d) => (d.time as number) >= signalStart),
    signal: signalRaw,
    histogram: histRaw,
  };
}

// ==========================================
// 하단 pane 엔트리 타입
// ==========================================
type LowerPaneEntry = {
  lines: LineSeriesApi[];
  hist?: HistogramSeriesApi;
  priceLines: ReturnType<LineSeriesApi['createPriceLine']>[];
};

// series를 모두 제거한 뒤 빈 pane을 찾아 제거
// index를 직접 추적하지 않고 panes() 순회로 안전하게 처리
function removeEmptyPanes(chart: IChartApi) {
  // 뒤에서부터 순회해야 splice로 인한 index 변화에 영향 없음
  const panes = chart.panes();
  for (let i = panes.length - 1; i >= 1; i--) {
    // pane[0](캔들)은 절대 제거하지 않음
    if (panes[i].getSeries().length === 0) {
      chart.removePane(i);
    }
  }
}

// ==========================================
// Manager
// ==========================================

export function createCandleIndicatorManagerV2(
  chart: IChartApi,
  priceSeries: ReturnType<IChartApi['addSeries']>,
  candlePaneIndex = 0,
  getCssVar: (name: string) => string,
  formatKoreanVolume: (v: number) => string,
): CandleIndicatorManagerV2 {
  const lineSeries = new Map<string, LineSeriesApi>();
  const bandsSeries = new Map<string, BandsIndicator>();
  const lowerPanes = new Map<string, LowerPaneEntry>();
  let volumeSeries: HistogramSeriesApi | null = null;
  let volumeMaSeries: LineSeriesApi | null = null;
  let volumePaneIdx: number | null = null;

  // ---- Ichimoku 상태 ----
  type IchimokuEntry = {
    tenkan: LineSeriesApi;
    kijun: LineSeriesApi;
    spanA: LineSeriesApi;
    spanB: LineSeriesApi;
    chikou: LineSeriesApi;
    cloud: IchimokuCloudIndicator;
  };
  let ichimokuEntry: IchimokuEntry | null = null;

  // 항상 현재 마지막 pane 다음에 추가
  function nextPaneIndex(): number {
    return chart.panes().length;
  }

  // ---- LineSeries (캔들 pane) ----

  function ensureLineSeries(id: string, color: string): LineSeriesApi {
    if (lineSeries.has(id)) return lineSeries.get(id)!;
    const s = chart.addSeries(
      LineSeries,
      {
        lineWidth: 1,
        color,
        crosshairMarkerVisible: false,
        priceLineVisible: false,
        lastValueVisible: false,
      },
      candlePaneIndex,
    );
    lineSeries.set(id, s);
    return s;
  }

  function removeLineSeries(id: string) {
    const s = lineSeries.get(id);
    if (s) {
      chart.removeSeries(s);
      lineSeries.delete(id);
    }
  }

  // ---- BandsIndicator ----

  function ensureBandsSeries(
    id: string,
    config: BollingerConfig | EnvelopeConfig,
  ): BandsIndicator {
    if (bandsSeries.has(id)) return bandsSeries.get(id)!;
    const indicator =
      config.type === 'bollinger'
        ? new BandsIndicator({
            mode: 'bollinger',
            lineColor: config.lineColor,
            fillColor: config.fillColor,
            period: config.period,
            k: config.k,
          })
        : new BandsIndicator({
            mode: 'envelope',
            lineColor: config.lineColor,
            fillColor: config.fillColor,
            period: config.period,
            envelopePercent: config.percent,
          });
    priceSeries.attachPrimitive(indicator);
    bandsSeries.set(id, indicator);
    return indicator;
  }

  function removeBandsSeries(id: string) {
    const b = bandsSeries.get(id);
    if (b) {
      priceSeries.detachPrimitive(b);
      bandsSeries.delete(id);
    }
  }

  // ---- Ichimoku ----

  /** (고가 + 저가) / 2 for N periods ending at index i */
  function hlMid(candles: CandlestickData[], i: number, period: number): number {
    let hi = -Infinity;
    let lo = Infinity;
    const start = Math.max(0, i - period + 1);
    for (let j = start; j <= i; j++) {
      if (candles[j].high > hi) hi = candles[j].high;
      if (candles[j].low < lo) lo = candles[j].low;
    }
    return (hi + lo) / 2;
  }

  /**
   * 첫번째 봉 이전 과거 타임스탬프를 추정해서 생성.
   * estimateFutureTimestamps의 대칭 버전.
   */
  function estimatePastTimestamps(candles: CandlestickData[], count: number): Time[] {
    if (candles.length < 2 || count <= 0) return [];
    const n = Math.min(candles.length - 1, 20);
    const intervals: number[] = [];
    for (let i = 1; i <= n; i++) {
      intervals.push((candles[i].time as number) - (candles[i - 1].time as number));
    }
    intervals.sort((a, b) => a - b);
    const interval = intervals[Math.floor(intervals.length / 2)];
    const firstTime = candles[0].time as number;
    return Array.from(
      { length: count },
      (_, i) => (firstTime - (count - i) * interval) as Time,
    );
  }

  /**
   * 마지막 봉 이후 미래 타임스탬프를 추정해서 생성.
   * 최근 캔들 간격의 중앙값을 사용해 불규칙한 간격에 강건하게 처리.
   */
  function estimateFutureTimestamps(candles: CandlestickData[], count: number): Time[] {
    if (candles.length < 2 || count <= 0) return [];
    const n = Math.min(candles.length - 1, 20);
    const intervals: number[] = [];
    for (let i = candles.length - 1; i > candles.length - 1 - n; i--) {
      intervals.push((candles[i].time as number) - (candles[i - 1].time as number));
    }
    intervals.sort((a, b) => a - b);
    const interval = intervals[Math.floor(intervals.length / 2)]; // 중앙값
    const lastTime = candles[candles.length - 1].time as number;
    return Array.from(
      { length: count },
      (_, i) => (lastTime + (i + 1) * interval) as Time,
    );
  }

  function calcIchimoku(
    candles: CandlestickData[],
    cfg: IchimokuConfig,
  ): {
    tenkan: LineData[];
    kijun: LineData[];
    spanA: LineData[];
    spanB: LineData[];
    chikou: LineData[];
    cloudData: CloudPoint[];
  } {
    const N = candles.length;
    const { tenkanPeriod, kijunPeriod, senkouBPeriod, displacement } = cfg;
    const chikouDisp = cfg.chikouDisplacement ?? displacement;

    // 마지막 봉 이후 / 첫번째 봉 이전 타임스탬프 생성
    const futureTimestamps = estimateFutureTimestamps(candles, displacement);
    const pastTimestamps = estimatePastTimestamps(candles, chikouDisp);

    /** displacement 앞 타임스탬프 반환 (기존 캔들 or 미래 추정) */
    function getFwdTime(i: number): Time {
      const fwdIdx = i + displacement;
      if (fwdIdx < N) return candles[fwdIdx].time;
      const futureOffset = fwdIdx - N; // 0-based future index
      return futureOffset < futureTimestamps.length
        ? futureTimestamps[futureOffset]
        : futureTimestamps[futureTimestamps.length - 1];
    }

    /** chikouDisp 뒤 타임스탬프 반환 (기존 캔들 or 과거 추정) */
    function getBwdTime(i: number): Time {
      const bwdIdx = i - chikouDisp;
      if (bwdIdx >= 0) return candles[bwdIdx].time;
      // i < chikouDisp: 첫봉 이전 과거 타임스탬프 사용
      return pastTimestamps[i] ?? pastTimestamps[0];
    }

    const tenkan: LineData[] = [];
    const kijun: LineData[] = [];
    const spanA: LineData[] = [];
    const spanB: LineData[] = [];
    const chikou: LineData[] = [];

    for (let i = 0; i < N; i++) {
      const t = candles[i].time;

      // 전환선/기준선: 기간 충족 이후부터 계산 (표준 일목균형표)
      if (i >= tenkanPeriod - 1) {
        tenkan.push({ time: t, value: hlMid(candles, i, tenkanPeriod) });
      }
      if (i >= kijunPeriod - 1) {
        kijun.push({ time: t, value: hlMid(candles, i, kijunPeriod) });
      }

      // 선행스팬1/2: displacement 앞 타임스탬프에 플롯 (기간 충족 이후, 미래 포함)
      if (i >= kijunPeriod - 1) {
        const tFwd = getFwdTime(i);
        const tk = hlMid(candles, i, tenkanPeriod);
        const kj = hlMid(candles, i, kijunPeriod);
        spanA.push({ time: tFwd, value: (tk + kj) / 2 });
      }
      if (i >= senkouBPeriod - 1) {
        const tFwd = getFwdTime(i);
        spanB.push({ time: tFwd, value: hlMid(candles, i, senkouBPeriod) });
      }

      // 후행스팬: 현재 종가를 displacement 뒤(과거) 타임스탬프에 플롯.
      // i < displacement인 첫 구간은 첫봉 이전 과거 타임스탬프로 연장.
      chikou.push({ time: getBwdTime(i), value: candles[i].close });
    }

    // 구름 데이터: spanA·spanB 시간 정렬 후 병합
    const spanAMap = new Map<number, number>(
      spanA.map((d) => [d.time as number, d.value]),
    );
    const cloudData: CloudPoint[] = [];
    for (const b of spanB) {
      const a = spanAMap.get(b.time as number);
      if (a !== undefined) {
        cloudData.push({ time: b.time, spanA: a, spanB: b.value });
      }
    }

    return { tenkan, kijun, spanA, spanB, chikou, cloudData };
  }

  function makeIchimokuLine(color: string, lineWidth: number): LineSeriesApi {
    return chart.addSeries(
      LineSeries,
      {
        lineWidth: lineWidth as 1 | 2 | 3 | 4,
        color,
        crosshairMarkerVisible: false,
        priceLineVisible: false,
        lastValueVisible: false,
      },
      candlePaneIndex,
    );
  }

  function ensureIchimokuEntry(
    candles: CandlestickData[],
    cfg: IchimokuConfig,
  ): IchimokuEntry {
    if (!ichimokuEntry) {
      const cloud = new IchimokuCloudIndicator();
      priceSeries.attachPrimitive(cloud);
      ichimokuEntry = {
        tenkan: makeIchimokuLine(cfg.tenkanColor, cfg.tenkanLineWidth ?? 1),
        kijun: makeIchimokuLine(cfg.kijunColor, cfg.kijunLineWidth ?? 1),
        spanA: makeIchimokuLine(cfg.spanAColor, cfg.spanALineWidth ?? 1),
        spanB: makeIchimokuLine(cfg.spanBColor, cfg.spanBLineWidth ?? 1),
        chikou: makeIchimokuLine(cfg.chikouColor, cfg.chikouLineWidth ?? 1),
        cloud,
      };
    }

    const entry = ichimokuEntry;
    const { tenkan, kijun, spanA, spanB, chikou, cloudData } = calcIchimoku(candles, cfg);

    // 선 색상·굵기 업데이트 (각 선별 독립 lineWidth)
    entry.tenkan.applyOptions({
      color: cfg.tenkanColor,
      lineWidth: cfg.tenkanLineWidth ?? 1,
      visible: cfg.tenkanVisible,
    });
    entry.kijun.applyOptions({
      color: cfg.kijunColor,
      lineWidth: cfg.kijunLineWidth ?? 1,
      visible: cfg.kijunVisible,
    });
    entry.spanA.applyOptions({
      color: cfg.spanAColor,
      lineWidth: cfg.spanALineWidth ?? 1,
      visible: cfg.spanAVisible,
    });
    entry.spanB.applyOptions({
      color: cfg.spanBColor,
      lineWidth: cfg.spanBLineWidth ?? 1,
      visible: cfg.spanBVisible,
    });
    entry.chikou.applyOptions({
      color: cfg.chikouColor,
      lineWidth: cfg.chikouLineWidth ?? 1,
      visible: cfg.chikouVisible,
    });

    // 데이터 세팅
    entry.tenkan.setData(tenkan);
    entry.kijun.setData(kijun);
    entry.spanA.setData(spanA);
    entry.spanB.setData(spanB);
    entry.chikou.setData(chikou);

    // 구름 프리미티브 업데이트
    if (cfg.showCloud) {
      entry.cloud.updateData(cloudData, cfg.bullishCloudColor, cfg.bearishCloudColor);
    } else {
      entry.cloud.updateData([], cfg.bullishCloudColor, cfg.bearishCloudColor);
    }

    return entry;
  }

  function removeIchimokuEntry() {
    if (!ichimokuEntry) return;
    priceSeries.detachPrimitive(ichimokuEntry.cloud);
    chart.removeSeries(ichimokuEntry.tenkan);
    chart.removeSeries(ichimokuEntry.kijun);
    chart.removeSeries(ichimokuEntry.spanA);
    chart.removeSeries(ichimokuEntry.spanB);
    chart.removeSeries(ichimokuEntry.chikou);
    ichimokuEntry = null;
  }

  // ---- Volume ----

  function calcVolumeSma(volumes: HistogramData[], period: number): LineData[] {
    if (!volumes.length || period <= 0) return [];
    const result: LineData[] = [];
    let sum = 0;
    for (let i = 0; i < volumes.length; i++) {
      sum += volumes[i].value;
      if (i >= period) sum -= volumes[i - period].value;
      if (i >= period - 1) {
        result.push({ time: volumes[i].time, value: sum / period });
      }
    }
    return result;
  }

  function ensureVolumeSeries(volumes: HistogramData[], config: VolumeConfig) {
    if (!volumeSeries) {
      volumePaneIdx = nextPaneIndex();
      volumeSeries = chart.addSeries(
        HistogramSeries,
        {
          priceFormat: { type: 'custom', formatter: formatKoreanVolume },
          priceLineVisible: false,
          lastValueVisible: true,
        },
        volumePaneIdx,
      );
    }
    volumeSeries.setData(volumes);

    const maEnabled = config.maEnabled ?? true;
    const maPeriod = config.maPeriod ?? 20;
    const maColor = config.maColor ?? '#26a69a';
    const maLineWidth = config.maLineWidth ?? 1;

    if (maEnabled) {
      if (!volumeMaSeries) {
        volumeMaSeries = chart.addSeries(
          LineSeries,
          {
            lineWidth: maLineWidth,
            color: maColor,
            crosshairMarkerVisible: false,
            priceLineVisible: false,
            lastValueVisible: false,
          },
          volumePaneIdx!,
        );
      }
      volumeMaSeries.applyOptions({ color: maColor, lineWidth: maLineWidth });
      volumeMaSeries.setData(calcVolumeSma(volumes, maPeriod));
    } else {
      if (volumeMaSeries) {
        chart.removeSeries(volumeMaSeries);
        volumeMaSeries = null;
      }
    }
  }

  function removeVolumeSeries() {
    if (volumeMaSeries) {
      chart.removeSeries(volumeMaSeries);
      volumeMaSeries = null;
    }
    if (!volumeSeries) return;
    chart.removeSeries(volumeSeries);
    volumeSeries = null;
    volumePaneIdx = null;
    removeEmptyPanes(chart);
  }

  // ---- 하단 pane (RSI, MACD) ----

  function ensureRsiPane(id: string, config: RsiConfig): LowerPaneEntry {
    if (lowerPanes.has(id)) return lowerPanes.get(id)!;
    const pi = nextPaneIndex();
    const rsiSeries = chart.addSeries(
      LineSeries,
      {
        lineWidth: 1,
        color: '#ba68c8',
        crosshairMarkerVisible: false,
        priceLineVisible: false,
        lastValueVisible: true,
        autoscaleInfoProvider: () => ({ priceRange: { minValue: 0, maxValue: 100 } }),
      },
      pi,
    );
    const overbought = rsiSeries.createPriceLine({
      price: 70,
      color: 'rgba(239,83,80,0.6)',
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: '70',
    } as PriceLineOptions);
    const oversold = rsiSeries.createPriceLine({
      price: 30,
      color: 'rgba(38,166,154,0.6)',
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: '30',
    } as PriceLineOptions);
    const entry: LowerPaneEntry = {
      lines: [rsiSeries],
      priceLines: [overbought, oversold],
    };
    lowerPanes.set(id, entry);
    void config;
    return entry;
  }

  function ensureMacdPane(id: string): LowerPaneEntry {
    if (lowerPanes.has(id)) return lowerPanes.get(id)!;
    const pi = nextPaneIndex();
    const macdLine = chart.addSeries(
      LineSeries,
      {
        lineWidth: 1,
        color: '#42a5f5',
        crosshairMarkerVisible: false,
        priceLineVisible: false,
        lastValueVisible: true,
      },
      pi,
    );
    const signalLine = chart.addSeries(
      LineSeries,
      {
        lineWidth: 1,
        color: '#ff7043',
        crosshairMarkerVisible: false,
        priceLineVisible: false,
        lastValueVisible: true,
      },
      pi,
    );
    const histSeries = chart.addSeries(
      HistogramSeries,
      { priceLineVisible: false, lastValueVisible: false },
      pi,
    );
    const entry: LowerPaneEntry = {
      lines: [macdLine, signalLine],
      hist: histSeries,
      priceLines: [],
    };
    lowerPanes.set(id, entry);
    return entry;
  }

  function removeLowerPane(id: string) {
    const entry = lowerPanes.get(id);
    if (!entry) return;
    for (const s of entry.lines) chart.removeSeries(s);
    if (entry.hist) chart.removeSeries(entry.hist);
    lowerPanes.delete(id);
    removeEmptyPanes(chart);
  }

  // ---- 비율 재조정 ----

  function rebalancePanes(hasVolume: boolean, hasRsi: boolean, hasMacd: boolean) {
    const panes = chart.panes();
    const lowerCount = (hasRsi ? 1 : 0) + (hasMacd ? 1 : 0);
    const candleWeight = 0.6;
    const volumeWeight = hasVolume ? 0.15 : 0;
    const lowerWeight =
      lowerCount > 0 ? (1 - candleWeight - volumeWeight) / lowerCount : 0;

    // 항상 panes[0]에 setStretchFactor를 호출해 렌더링을 강제 트리거
    panes[0]?.setStretchFactor(candleWeight);

    let idx = 1;
    if (hasVolume && panes[idx]) {
      panes[idx]?.setStretchFactor(volumeWeight);
      idx++;
    }
    for (let i = 0; i < lowerCount; i++) panes[idx + i]?.setStretchFactor(lowerWeight);
  }

  // ---- 상단 지표 ----

  function applyUpperConfig(candles: CandlestickData[], config: UpperIndicatorConfig) {
    const { id, enabled } = config;
    if (!enabled) {
      removeLineSeries(id);
      removeBandsSeries(id);
      if (config.type === 'ichimoku') removeIchimokuEntry();
      return;
    }
    if (config.type === 'sma') {
      const c = config as SmaConfig;
      const s = ensureLineSeries(id, c.color);
      s.applyOptions({ color: c.color, lineWidth: c.lineWidth ?? 1 });
      s.setData(calcSmaV2(candles, c.period, c.source));
    } else if (config.type === 'ema') {
      const c = config as EmaConfig;
      const s = ensureLineSeries(id, c.color);
      s.applyOptions({ color: c.color, lineWidth: c.lineWidth ?? 1 });
      s.setData(calcEma(candles, c.period, c.source));
    } else if (config.type === 'bollinger' || config.type === 'envelope') {
      ensureBandsSeries(id, config);
    } else if (config.type === 'ichimoku') {
      ensureIchimokuEntry(candles, config as IchimokuConfig);
    }
  }

  // ---- apply ----
  // 처리 순서: 상단 → volume(먼저!) → RSI/MACD
  // volume을 반드시 RSI/MACD보다 먼저 처리해야 pane 순서가 올바름

  const apply = (
    candles: CandlestickData[],
    options: IndicatorOptions,
    volumes: HistogramData[],
  ) => {
    // 상단 지표
    const newUpperIds = new Set(options.upper.map((c) => c.id));
    for (const id of [...lineSeries.keys()]) {
      if (!newUpperIds.has(id)) removeLineSeries(id);
    }
    for (const id of [...bandsSeries.keys()]) {
      if (!newUpperIds.has(id)) removeBandsSeries(id);
    }
    for (const config of options.upper) applyUpperConfig(candles, config);

    // volume (RSI/MACD보다 먼저)
    const volumeConfig = options.lower.find((c) => c.type === 'volume') as
      | VolumeConfig
      | undefined;
    const volumeEnabled = volumeConfig?.enabled ?? true;
    if (volumeEnabled && volumeConfig) ensureVolumeSeries(volumes, volumeConfig);
    else removeVolumeSeries();

    // 하단 지표
    const newLowerIds = new Set(
      options.lower.filter((c) => c.type !== 'volume').map((c) => c.id),
    );
    for (const id of [...lowerPanes.keys()]) {
      if (!newLowerIds.has(id)) removeLowerPane(id);
    }

    let hasRsi = false;
    let hasMacd = false;
    for (const config of options.lower) {
      if (config.type === 'volume') continue;
      if (config.type === 'rsi') {
        if (!config.enabled) {
          removeLowerPane(config.id);
        } else {
          hasRsi = true;
          ensureRsiPane(config.id, config as RsiConfig).lines[0]?.setData(
            calcRsi(candles, config.period),
          );
        }
      } else if (config.type === 'macd') {
        if (!config.enabled) {
          removeLowerPane(config.id);
        } else {
          hasMacd = true;
          const entry = ensureMacdPane(config.id);
          const { macd, signal, histogram } = calcMacd(
            candles,
            (config as MacdConfig).fastPeriod,
            (config as MacdConfig).slowPeriod,
            (config as MacdConfig).signalPeriod,
          );
          entry.lines[0]?.setData(macd);
          entry.lines[1]?.setData(signal);
          entry.hist?.setData(histogram);
        }
      }
    }

    rebalancePanes(volumeEnabled, hasRsi, hasMacd);
  };

  const dispose = () => {
    for (const id of [...lineSeries.keys()]) removeLineSeries(id);
    for (const id of [...bandsSeries.keys()]) removeBandsSeries(id);
    removeIchimokuEntry();
    // dispose 시에는 chart.remove()가 곧 호출되므로 removePane 불필요
    if (volumeMaSeries) {
      chart.removeSeries(volumeMaSeries);
      volumeMaSeries = null;
    }
    if (volumeSeries) {
      chart.removeSeries(volumeSeries);
      volumeSeries = null;
    }
    for (const entry of [...lowerPanes.values()]) {
      for (const s of entry.lines) chart.removeSeries(s);
      if (entry.hist) chart.removeSeries(entry.hist);
    }
    lowerPanes.clear();
  };

  return { apply, dispose };
}
