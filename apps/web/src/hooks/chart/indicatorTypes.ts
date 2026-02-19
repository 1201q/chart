// ==========================================
// 상단 지표 (가격 pane 오버레이)
// ==========================================
export type SmaConfig = {
  type: 'sma';
  id: string;
  enabled: boolean;
  period: number;
  color: string;
};

export type EmaConfig = {
  type: 'ema';
  id: string;
  enabled: boolean;
  period: number;
  color: string;
};

export type BollingerConfig = {
  type: 'bollinger';
  id: string;
  enabled: boolean;
  period: number;
  k: number;
  lineColor: string;
  fillColor: string;
};

export type EnvelopeConfig = {
  type: 'envelope';
  id: string;
  enabled: boolean;
  period: number;
  percent: number;
  lineColor: string;
  fillColor: string;
};

export type UpperIndicatorConfig =
  | SmaConfig
  | EmaConfig
  | BollingerConfig
  | EnvelopeConfig;

// ==========================================
// 하단 지표 (별도 pane)
// ==========================================
export type VolumeConfig = {
  type: 'volume';
  id: string;
  enabled: boolean;
};

export type RsiConfig = {
  type: 'rsi';
  id: string;
  enabled: boolean;
  period: number;
};

export type MacdConfig = {
  type: 'macd';
  id: string;
  enabled: boolean;
  fastPeriod: number;
  slowPeriod: number;
  signalPeriod: number;
};

export type LowerIndicatorConfig = VolumeConfig | RsiConfig | MacdConfig;

// ==========================================
// 통합 타입
// ==========================================
export type IndicatorConfig = UpperIndicatorConfig | LowerIndicatorConfig;

export type IndicatorOptions = {
  upper: UpperIndicatorConfig[];
  lower: LowerIndicatorConfig[];
};

// ==========================================
// 기본값
// ==========================================
export const DEFAULT_INDICATOR_OPTIONS: IndicatorOptions = {
  upper: [
    { type: 'sma', id: 'sma-5', enabled: true, period: 5, color: '#26a69a' },
    { type: 'sma', id: 'sma-20', enabled: true, period: 20, color: '#ef5350' },
    { type: 'sma', id: 'sma-60', enabled: false, period: 60, color: '#f48fb1' },
    { type: 'sma', id: 'sma-120', enabled: false, period: 120, color: '#ab47bc' },
    { type: 'ema', id: 'ema-20', enabled: false, period: 20, color: '#ffb74d' },
    {
      type: 'bollinger',
      id: 'bb-1',
      enabled: true,
      period: 20,
      k: 2,
      lineColor: 'rgba(100, 181, 246, 0.8)',
      fillColor: 'rgba(100, 181, 246, 0.1)',
    },
    {
      type: 'envelope',
      id: 'env-1',
      enabled: false,
      period: 20,
      percent: 0.06,
      lineColor: 'rgba(255, 167, 38, 0.8)',
      fillColor: 'rgba(255, 167, 38, 0.1)',
    },
  ],
  lower: [
    { type: 'volume', id: 'vol-1', enabled: true },
    { type: 'rsi', id: 'rsi-1', enabled: false, period: 14 },
    {
      type: 'macd',
      id: 'macd-1',
      enabled: false,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
    },
  ],
};

// ==========================================
// localStorage 유틸
// ==========================================
export const INDICATOR_STORAGE_KEY = 'chart-indicator-options';

function isValidIndicatorOptions(v: unknown): v is IndicatorOptions {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return Array.isArray(o.upper) && Array.isArray(o.lower);
}

export function loadIndicatorOptions(): IndicatorOptions {
  if (typeof window === 'undefined') return DEFAULT_INDICATOR_OPTIONS;
  try {
    const raw = localStorage.getItem(INDICATOR_STORAGE_KEY);
    if (!raw) return DEFAULT_INDICATOR_OPTIONS;
    const parsed = JSON.parse(raw);
    if (!isValidIndicatorOptions(parsed)) return DEFAULT_INDICATOR_OPTIONS;
    return parsed;
  } catch {
    return DEFAULT_INDICATOR_OPTIONS;
  }
}

export function saveIndicatorOptions(opts: IndicatorOptions): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(INDICATOR_STORAGE_KEY, JSON.stringify(opts));
  } catch {
    // 저장 실패 시 무시 (용량 초과 등)
  }
}
