// ==========================================
// 상단 지표 (가격 pane 오버레이)
// ==========================================
export type IndicatorSource = 'close' | 'open' | 'high' | 'low';

export type SmaConfig = {
  type: 'sma';
  id: string;
  enabled: boolean;
  period: number;
  color: string;
  lineWidth: 1 | 2 | 3 | 4;
  source: IndicatorSource;
};

export type EmaConfig = {
  type: 'ema';
  id: string;
  enabled: boolean;
  period: number;
  color: string;
  lineWidth: 1 | 2 | 3 | 4;
  source: IndicatorSource;
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
    {
      type: 'sma',
      id: 'sma-5',
      enabled: true,
      period: 5,
      color: '#26a69a',
      lineWidth: 1,
      source: 'close',
    },
    {
      type: 'sma',
      id: 'sma-20',
      enabled: true,
      period: 20,
      color: '#ef5350',
      lineWidth: 1,
      source: 'close',
    },
    {
      type: 'sma',
      id: 'sma-60',
      enabled: true,
      period: 60,
      color: '#f48fb1',
      lineWidth: 1,
      source: 'close',
    },
    {
      type: 'sma',
      id: 'sma-120',
      enabled: true,
      period: 120,
      color: '#ab47bc',
      lineWidth: 1,
      source: 'close',
    },
    {
      type: 'ema',
      id: 'ema-20',
      enabled: false,
      period: 20,
      color: '#ffb74d',
      lineWidth: 1,
      source: 'close',
    },
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

// ==========================================
// SMA 동적 추가/삭제 유틸
// ==========================================
const SMA_DEFAULT_COLORS = [
  '#26a69a',
  '#ef5350',
  '#f48fb1',
  '#ab47bc',
  '#42a5f5',
  '#ffb74d',
  '#66bb6a',
  '#ff7043',
];

export function createSmaConfig(existingSmas: SmaConfig[]): SmaConfig {
  const usedColors = new Set(existingSmas.map((c) => c.color));
  const color =
    SMA_DEFAULT_COLORS.find((c) => !usedColors.has(c)) ??
    SMA_DEFAULT_COLORS[existingSmas.length % SMA_DEFAULT_COLORS.length];

  // 이미 사용 중인 기간보다 큰 다음 기본 기간 선택
  const defaultPeriods = [5, 10, 20, 60, 120, 200];
  const usedPeriods = new Set(existingSmas.map((c) => c.period));
  const period =
    defaultPeriods.find((p) => !usedPeriods.has(p)) ??
    (existingSmas[existingSmas.length - 1]?.period ?? 5) + 10;

  return {
    type: 'sma',
    id: `sma-${Date.now()}`,
    enabled: true,
    period,
    color,
    lineWidth: 1,
    source: 'close',
  };
}
