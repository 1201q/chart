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
  MacdConfig,
  RsiConfig,
  SmaConfig,
  UpperIndicatorConfig,
} from './indicatorTypes';

type LineSeriesApi = ReturnType<IChartApi['addSeries']>;
type HistogramSeriesApi = ReturnType<IChartApi['addSeries']>;

export type CandleIndicatorManagerV2 = {
  apply(candles: CandlestickData[], options: IndicatorOptions): void;
  dispose(): void;
};

// ==========================================
// 계산 함수
// ==========================================

export function calcSmaV2(candles: CandlestickData[], period: number): LineData[] {
  if (!candles.length || period <= 0) return [];

  const result: LineData[] = [];
  let sum = 0;
  const closes = candles.map((c) => c.close);

  for (let i = 0; i < closes.length; i++) {
    sum += closes[i];
    if (i >= period) sum -= closes[i - period];
    if (i >= period - 1) {
      result.push({ time: candles[i].time, value: sum / period });
    }
  }

  return result;
}

export function calcEma(candles: CandlestickData[], period: number): LineData[] {
  if (candles.length < period || period <= 0) return [];

  const k = 2 / (period + 1);
  let ema = candles[period - 1].close;
  const result: LineData[] = [{ time: candles[period - 1].time, value: ema }];

  for (let i = period; i < candles.length; i++) {
    ema = candles[i].close * k + ema * (1 - k);
    result.push({ time: candles[i].time, value: ema });
  }

  return result;
}

export function calcRsi(candles: CandlestickData[], period = 14): LineData[] {
  if (candles.length <= period || period <= 0) return [];

  const closes = candles.map((c) => c.close);
  const result: LineData[] = [];

  // 초기 avgGain/avgLoss: 첫 period개의 단순 평균
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) avgGain += diff;
    else avgLoss += -diff;
  }
  avgGain /= period;
  avgLoss /= period;

  const rsi0 = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  result.push({ time: candles[period].time, value: rsi0 });

  // 이후: Wilder's smoothing
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    result.push({ time: candles[i].time, value: rsi });
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

  // slow EMA 시작 시점 기준으로 time → value 맵 구성
  const fastMap = new Map<number, number>(
    fastEma.map((d) => [d.time as number, d.value]),
  );

  // macdLine: slow EMA와 같은 시점에서 계산
  const macdRaw: LineData[] = [];
  for (const s of slowEma) {
    const t = s.time as number;
    const f = fastMap.get(t);
    if (f !== undefined) {
      macdRaw.push({ time: s.time, value: f - s.value });
    }
  }

  if (macdRaw.length < signalPeriod) return empty;

  // signalLine: macdLine의 EMA(signalPeriod)
  const k = 2 / (signalPeriod + 1);
  let sigEma = macdRaw[signalPeriod - 1].value;
  const signalRaw: LineData[] = [{ time: macdRaw[signalPeriod - 1].time, value: sigEma }];

  for (let i = signalPeriod; i < macdRaw.length; i++) {
    sigEma = macdRaw[i].value * k + sigEma * (1 - k);
    signalRaw.push({ time: macdRaw[i].time, value: sigEma });
  }

  // histogram: macd - signal (signal 시작 시점부터)
  const sigMap = new Map<number, number>(
    signalRaw.map((d) => [d.time as number, d.value]),
  );
  const histRaw: HistogramData[] = [];
  for (const m of macdRaw) {
    const t = m.time as number;
    const sig = sigMap.get(t);
    if (sig !== undefined) {
      const val = m.value - sig;
      histRaw.push({
        time: m.time,
        value: val,
        color: val >= 0 ? 'rgba(239, 83, 80, 0.7)' : 'rgba(38, 166, 154, 0.7)',
      });
    }
  }

  // macd도 signal 시작 시점 이후만
  const signalStart = signalRaw[0].time as number;
  const macdAligned = macdRaw.filter((d) => (d.time as number) >= signalStart);

  return { macd: macdAligned, signal: signalRaw, histogram: histRaw };
}

// ==========================================
// 하단 pane 엔트리 타입
// ==========================================
type LowerPaneEntry = {
  paneIndex: number;
  lines: LineSeriesApi[];
  hist?: HistogramSeriesApi;
  priceLines: ReturnType<LineSeriesApi['createPriceLine']>[];
};

// ==========================================
// Manager
// ==========================================

export function createCandleIndicatorManagerV2(
  chart: IChartApi,
  priceSeries: ReturnType<IChartApi['addSeries']>,
  paneIndex = 0,
): CandleIndicatorManagerV2 {
  // id → LineSeries (SMA, EMA)
  const lineSeries = new Map<string, LineSeriesApi>();

  // id → BandsIndicator (Bollinger, Envelope)
  const bandsSeries = new Map<string, BandsIndicator>();

  // id → 하단 pane 엔트리 (RSI, MACD)
  const lowerPanes = new Map<string, LowerPaneEntry>();
  let nextPaneIndex = 2;

  // ---- LineSeries 관리 ----

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
      paneIndex,
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

  // ---- BandsIndicator 관리 ----

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
      b.detached();
      bandsSeries.delete(id);
    }
  }

  // ---- 하단 pane 관리 ----

  function ensureRsiPane(id: string, config: RsiConfig): LowerPaneEntry {
    if (lowerPanes.has(id)) return lowerPanes.get(id)!;

    const pi = nextPaneIndex++;
    const rsiSeries = chart.addSeries(
      LineSeries,
      {
        lineWidth: 1,
        color: '#ba68c8',
        crosshairMarkerVisible: false,
        priceLineVisible: false,
        lastValueVisible: true,
        autoscaleInfoProvider: () => ({
          priceRange: { minValue: 0, maxValue: 100 },
        }),
      },
      pi,
    );

    const overbought = rsiSeries.createPriceLine({
      price: 70,
      color: 'rgba(239, 83, 80, 0.6)',
      lineWidth: 1,
      lineStyle: 2, // dashed
      axisLabelVisible: true,
      title: '70',
    } as PriceLineOptions);

    const oversold = rsiSeries.createPriceLine({
      price: 30,
      color: 'rgba(38, 166, 154, 0.6)',
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: '30',
    } as PriceLineOptions);

    const entry: LowerPaneEntry = {
      paneIndex: pi,
      lines: [rsiSeries],
      priceLines: [overbought, oversold],
    };
    lowerPanes.set(id, entry);

    // RSI pane 설정 반영
    void config;
    return entry;
  }

  function ensureMacdPane(id: string): LowerPaneEntry {
    if (lowerPanes.has(id)) return lowerPanes.get(id)!;

    const pi = nextPaneIndex++;

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
      {
        priceScaleId: 'macd-hist',
        priceLineVisible: false,
        lastValueVisible: false,
      },
      pi,
    );

    const entry: LowerPaneEntry = {
      paneIndex: pi,
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

    // 히스토그램 먼저 제거
    if (entry.hist) {
      chart.removeSeries(entry.hist);
    }
    // 라인 제거
    for (const s of entry.lines) {
      chart.removeSeries(s);
    }
    lowerPanes.delete(id);
  }

  // ---- stretch factor 재조정 ----

  function rebalancePanes(hasRsi: boolean, hasMacd: boolean) {
    const panes = chart.panes();
    if (panes.length < 2) return;

    if (!hasRsi && !hasMacd) {
      panes[0]?.setStretchFactor(0.8);
      panes[1]?.setStretchFactor(0.2);
    } else if (hasRsi && hasMacd) {
      panes[0]?.setStretchFactor(0.55);
      panes[1]?.setStretchFactor(0.13);
      panes[2]?.setStretchFactor(0.16);
      panes[3]?.setStretchFactor(0.16);
    } else {
      // RSI 또는 MACD 하나만 활성
      panes[0]?.setStretchFactor(0.65);
      panes[1]?.setStretchFactor(0.15);
      panes[2]?.setStretchFactor(0.2);
    }
  }

  // ---- apply ----

  function applyUpperConfig(candles: CandlestickData[], config: UpperIndicatorConfig) {
    const { id, enabled } = config;

    if (!enabled) {
      removeLineSeries(id);
      removeBandsSeries(id);
      return;
    }

    if (config.type === 'sma') {
      const s = ensureLineSeries(id, (config as SmaConfig).color);
      s.setData(calcSmaV2(candles, config.period));
    } else if (config.type === 'ema') {
      const s = ensureLineSeries(id, (config as EmaConfig).color);
      s.setData(calcEma(candles, config.period));
    } else if (config.type === 'bollinger' || config.type === 'envelope') {
      ensureBandsSeries(id, config);
    }
  }

  const apply = (candles: CandlestickData[], options: IndicatorOptions) => {
    // 현재 등록된 id 세트 수집 (삭제 감지용)
    const newUpperIds = new Set(options.upper.map((c) => c.id));

    // 더 이상 options에 없는 시리즈 제거
    for (const id of lineSeries.keys()) {
      if (!newUpperIds.has(id)) removeLineSeries(id);
    }
    for (const id of bandsSeries.keys()) {
      if (!newUpperIds.has(id)) removeBandsSeries(id);
    }

    // 상단 지표 적용
    for (const config of options.upper) {
      applyUpperConfig(candles, config);
    }

    // 하단 지표 처리 (volume 제외)
    const newLowerIds = new Set(options.lower.map((c) => c.id));

    // 더 이상 없는 하단 pane 제거
    for (const id of lowerPanes.keys()) {
      if (!newLowerIds.has(id)) removeLowerPane(id);
    }

    let hasRsi = false;
    let hasMacd = false;

    for (const config of options.lower) {
      if (config.type === 'volume') continue; // volume은 useChartInstance에서 관리

      if (config.type === 'rsi') {
        if (!config.enabled) {
          removeLowerPane(config.id);
        } else {
          hasRsi = true;
          const entry = ensureRsiPane(config.id, config as RsiConfig);
          const rsiData = calcRsi(candles, config.period);
          entry.lines[0]?.setData(rsiData);
        }
      } else if (config.type === 'macd') {
        if (!config.enabled) {
          removeLowerPane(config.id);
        } else {
          hasMacd = true;
          const entry = ensureMacdPane(config.id);
          const { macd, signal, histogram } = calcMacd(
            candles,
            config.fastPeriod,
            config.slowPeriod,
            config.signalPeriod,
          );
          entry.lines[0]?.setData(macd);
          entry.lines[1]?.setData(signal);
          entry.hist?.setData(histogram);
        }
      }
    }

    rebalancePanes(hasRsi, hasMacd);
  };

  const dispose = () => {
    for (const id of [...lineSeries.keys()]) removeLineSeries(id);
    for (const id of [...bandsSeries.keys()]) removeBandsSeries(id);
    for (const id of [...lowerPanes.keys()]) removeLowerPane(id);
  };

  return { apply, dispose };
}
