import { CandlestickData, IChartApi, LineData, LineSeries } from 'lightweight-charts';
import { BandsIndicator } from './indicators/bands-indicator';

type LineSeriesApi = ReturnType<IChartApi['addSeries']>;
type PriceSeriesApi = ReturnType<IChartApi['addSeries']>;

export type MaOptions = {
  enabled: boolean;
  period: number;
  color: string;
};

export type BollingerOptions = {
  enabled: boolean;
  period: number;
  k: number;
  midLineColor?: string;
  bandLineColor?: string;
  bandFillColor?: string;
};

export type EnvelopeOptions = {
  enabled: boolean;
  period: number;
  envelopePercent: number;
  midLineColor?: string;
  bandLineColor?: string;
  bandFillColor?: string;
};

export type CandleIndicatorOptions = {
  ma: MaOptions;
  bollinger: BollingerOptions;
  evelope: EnvelopeOptions;
};

export type CandleIndicatorManager = {
  apply(candles: CandlestickData[], options: CandleIndicatorOptions): void;
  dispose(): void;
};

// ==========================
// 계산 함수들
// ==========================

export const calcSma = (candles: CandlestickData[], period = 20): LineData[] => {
  if (!candles.length || period <= 0) return [];

  const result: LineData[] = [];
  let sum = 0;
  const closes = candles.map((c) => c.close);

  for (let i = 0; i < candles.length; i++) {
    sum += closes[i];

    if (i >= period) {
      sum -= closes[i - period];
    }

    if (i >= period - 1) {
      const avg = sum / period;
      result.push({
        time: candles[i].time,
        value: avg,
      });
    }
  }

  return result;
};

// ==========================
// Manager
// ==========================
export function createCandleIndicatorManager(
  chart: IChartApi,
  priceSeries: PriceSeriesApi,
  paneIndex = 0,
): CandleIndicatorManager {
  let maSeries: LineSeriesApi | null = null;

  // bolinger series
  let bbBandsSeries: BandsIndicator | null = null;

  // envelope series
  let evenlopeBandsSeries: BandsIndicator | null = null;

  const ensureMaSeries = (opts: MaOptions): LineSeriesApi => {
    if (maSeries) return maSeries;

    maSeries = chart.addSeries(
      LineSeries,
      {
        lineWidth: 2,
        color: opts.color,
        crosshairMarkerVisible: false,
        priceLineVisible: false,
        lastValueVisible: false,
      },
      paneIndex,
    );
    return maSeries;
  };

  const ensureBbBands = (opts: BollingerOptions): BandsIndicator => {
    if (bbBandsSeries) return bbBandsSeries;

    bbBandsSeries = new BandsIndicator({
      lineColor: opts.bandLineColor,
      fillColor: opts.bandFillColor,
      k: opts.k,
      period: opts.period,
    });

    priceSeries.attachPrimitive(bbBandsSeries);

    return bbBandsSeries;
  };

  const ensureEnvelopeBands = (opts: EnvelopeOptions): BandsIndicator => {
    if (evenlopeBandsSeries) return evenlopeBandsSeries;

    evenlopeBandsSeries = new BandsIndicator({
      mode: 'envelope',
      lineColor: opts.bandLineColor,
      fillColor: opts.bandFillColor,
      envelopePercent: opts.envelopePercent,
      period: opts.period,
    });

    priceSeries.attachPrimitive(evenlopeBandsSeries);

    return evenlopeBandsSeries;
  };

  const removeMaSeries = () => {
    if (maSeries) {
      chart.removeSeries(maSeries);
      maSeries = null;
    }
  };

  const removeBbSeries = () => {
    if (bbBandsSeries) {
      bbBandsSeries.detached();
      bbBandsSeries = null;
    }
  };

  const removeEnvelopeSeries = () => {
    if (evenlopeBandsSeries) {
      evenlopeBandsSeries.detached();
      evenlopeBandsSeries = null;
    }
  };

  const apply = (candles: CandlestickData[], options: CandleIndicatorOptions) => {
    // sma
    if (options.ma.enabled) {
      const s = ensureMaSeries(options.ma);
      const data = calcSma(candles, options.ma.period);
      s.setData(data);
    } else {
      removeMaSeries();
    }

    if (options.bollinger.enabled) {
      ensureBbBands(options.bollinger);
    } else {
      removeBbSeries();
    }

    if (options.evelope.enabled) {
      ensureEnvelopeBands(options.evelope);
    } else {
      removeEnvelopeSeries();
    }
  };

  const dispose = () => {
    removeMaSeries();
    removeBbSeries();
    removeEnvelopeSeries();
  };

  return {
    apply,
    dispose,
  };
}
