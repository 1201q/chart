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

export type IchimokuConfig = {
  type: 'ichimoku';
  id: string;
  enabled: boolean;
  // 전환선 (Tenkan-sen)
  tenkanPeriod: number;
  tenkanColor: string;
  tenkanLineWidth: 1 | 2 | 3 | 4;
  tenkanVisible: boolean;
  // 기준선 (Kijun-sen)
  kijunPeriod: number;
  kijunColor: string;
  kijunLineWidth: 1 | 2 | 3 | 4;
  kijunVisible: boolean;
  // 선행스팬1 (Senkou Span A) — 이격 기간 (앞이동)
  displacement: number;
  spanAColor: string;
  spanALineWidth: 1 | 2 | 3 | 4;
  spanAVisible: boolean;
  // 선행스팬2 (Senkou Span B)
  senkouBPeriod: number;
  spanBColor: string;
  spanBLineWidth: 1 | 2 | 3 | 4;
  spanBVisible: boolean;
  // 후행스팬 (Chikou Span) — 이격 기간 (뒤이동, 독립)
  chikouDisplacement: number;
  chikouColor: string;
  chikouLineWidth: 1 | 2 | 3 | 4;
  chikouVisible: boolean;
  // 구름 (Kumo)
  bullishCloudColor: string;
  bearishCloudColor: string;
  showCloud: boolean;
};

export type UpperIndicatorConfig =
  | SmaConfig
  | EmaConfig
  | BollingerConfig
  | EnvelopeConfig
  | IchimokuConfig;

// ==========================================
// 하단 지표 (별도 pane)
// ==========================================
export type VolumeConfig = {
  type: 'volume';
  id: string;
  enabled: boolean;
  maEnabled?: boolean;
  maPeriod?: number;
  maColor?: string;
  maLineWidth?: 1 | 2 | 3 | 4;
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
    {
      type: 'ichimoku',
      id: 'ichimoku-1',
      enabled: false,
      tenkanPeriod: 9,
      tenkanColor: '#ffb74d',
      tenkanLineWidth: 1,
      tenkanVisible: true,
      kijunPeriod: 26,
      kijunColor: '#26a69a',
      kijunLineWidth: 1,
      kijunVisible: true,
      displacement: 26,
      spanAColor: '#ef9a9a',
      spanALineWidth: 1,
      spanAVisible: true,
      senkouBPeriod: 52,
      spanBColor: '#90caf9',
      spanBLineWidth: 1,
      spanBVisible: true,
      chikouDisplacement: 26,
      chikouColor: '#78909c',
      chikouLineWidth: 1,
      chikouVisible: true,
      bullishCloudColor: 'rgba(239,154,154,0.3)',
      bearishCloudColor: 'rgba(38,50,56,0.4)',
      showCloud: true,
    },
  ],
  lower: [
    {
      type: 'volume',
      id: 'vol-1',
      enabled: true,
      maEnabled: true,
      maPeriod: 20,
      maColor: '#26a69a',
      maLineWidth: 1,
    },
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

/**
 * 저장된 옵션에 없는 새 기본 지표 항목을 병합.
 * 기존 사용자 설정을 유지하면서 새로 추가된 지표를 자동으로 포함시킨다.
 */
function mergeWithDefaults(saved: IndicatorOptions): IndicatorOptions {
  const savedUpperIds = new Set(saved.upper.map((c) => c.id));
  const savedLowerIds = new Set(saved.lower.map((c) => c.id));

  const newUpperItems = DEFAULT_INDICATOR_OPTIONS.upper.filter(
    (c) => !savedUpperIds.has(c.id),
  );
  const newLowerItems = DEFAULT_INDICATOR_OPTIONS.lower.filter(
    (c) => !savedLowerIds.has(c.id),
  );

  return {
    upper: [...saved.upper, ...newUpperItems],
    lower: [...saved.lower, ...newLowerItems],
  };
}

export function loadIndicatorOptions(): IndicatorOptions {
  if (typeof window === 'undefined') return DEFAULT_INDICATOR_OPTIONS;
  try {
    const raw = localStorage.getItem(INDICATOR_STORAGE_KEY);
    if (!raw) return DEFAULT_INDICATOR_OPTIONS;
    const parsed = JSON.parse(raw);
    if (!isValidIndicatorOptions(parsed)) return DEFAULT_INDICATOR_OPTIONS;
    // 기존 저장 데이터에 없는 새 지표를 기본값에서 병합
    return mergeWithDefaults(parsed);
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
