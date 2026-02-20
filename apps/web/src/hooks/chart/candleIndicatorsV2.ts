import {
  CandlestickData,
  HistogramData,
  HistogramSeries,
  IChartApi,
  LineData,
  LineSeries,
  PriceLineOptions,
} from 'lightweight-charts';

import { BandsIndicator } from './indicators/bands-indicator';
import {
  BollingerConfig,
  EmaConfig,
  EnvelopeConfig,
  IndicatorOptions,
  IndicatorSource,
  MacdConfig,
  RsiConfig,
  SmaConfig,
  UpperIndicatorConfig,
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

  // ---- Volume ----

  function ensureVolumeSeries(volumes: HistogramData[]) {
    if (volumeSeries) {
      volumeSeries.setData(volumes);
      return;
    }
    volumeSeries = chart.addSeries(
      HistogramSeries,
      {
        priceFormat: { type: 'custom', formatter: formatKoreanVolume },
        priceLineVisible: false,
        lastValueVisible: false,
      },
      nextPaneIndex(),
    );
    volumeSeries.setData(volumes);
  }

  function removeVolumeSeries() {
    if (!volumeSeries) return;
    chart.removeSeries(volumeSeries);
    volumeSeries = null;
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
    const volumeEnabled = options.lower.find((c) => c.type === 'volume')?.enabled ?? true;
    if (volumeEnabled) ensureVolumeSeries(volumes);
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
    // dispose 시에는 chart.remove()가 곧 호출되므로 removePane 불필요
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
