'use client';

import { useEffect, useRef, useState } from 'react';

import {
  BollingerConfig,
  EmaConfig,
  EnvelopeConfig,
  IndicatorOptions,
  IndicatorSource,
  LowerIndicatorConfig,
  MacdConfig,
  RsiConfig,
  SmaConfig,
  UpperIndicatorConfig,
  createSmaConfig,
} from '@/hooks/chart/indicatorTypes';

import styles from './IndicatorPanel.module.css';

// ──────────────────────────────────────
// 상수
// ──────────────────────────────────────
type IndicatorKey = 'sma' | 'ema' | 'bollinger' | 'envelope' | 'volume' | 'rsi' | 'macd';

interface IndicatorPanelProps {
  options: IndicatorOptions;
  onChange: (next: IndicatorOptions) => void;
  onReset: () => void;
}

const UPPER_ITEMS: { key: IndicatorKey; label: string }[] = [
  { key: 'sma', label: '이동평균선' },
  { key: 'ema', label: '지수이동평균선' },
  { key: 'bollinger', label: '볼린저밴드' },
  { key: 'envelope', label: '엔벨로프' },
];

const LOWER_ITEMS: { key: IndicatorKey; label: string }[] = [
  { key: 'volume', label: '거래량' },
  { key: 'rsi', label: 'RSI' },
  { key: 'macd', label: 'MACD' },
];

const SOURCE_LABELS: Record<IndicatorSource, string> = {
  close: '종가',
  open: '시가',
  high: '고가',
  low: '저가',
};

// 팔레트 색상 (4행 × 8열 = 32색)
const PALETTE_COLORS: string[][] = [
  [
    '#607d8b',
    '#3f51b5',
    '#7b1fa2',
    '#c62828',
    '#e65100',
    '#f57f17',
    '#00695c',
    '#2e7d32',
  ],
  [
    '#546e7a',
    '#5c6bc0',
    '#8e24aa',
    '#d32f2f',
    '#ef6c00',
    '#f9a825',
    '#00796b',
    '#388e3c',
  ],
  [
    '#78909c',
    '#7986cb',
    '#ba68c8',
    '#ef5350',
    '#ff7043',
    '#ffca28',
    '#26a69a',
    '#66bb6a',
  ],
  [
    '#b0bec5',
    '#9fa8da',
    '#ce93d8',
    '#ef9a9a',
    '#ffab91',
    '#fff176',
    '#80cbc4',
    '#a5d6a7',
  ],
];

const LINE_WIDTHS = [1, 2, 3, 4] as const;

// ──────────────────────────────────────
// 숫자 입력
// ──────────────────────────────────────
function NumInput({
  value,
  min,
  max,
  onCommit,
}: {
  value: number;
  min?: number;
  max?: number;
  onCommit: (v: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  function commit() {
    const n = Number(draft);
    if (!isNaN(n) && n > 0) {
      if (min !== undefined && n < min) return;
      if (max !== undefined && n > max) return;
      onCommit(n);
    } else {
      setDraft(String(value));
    }
  }

  return (
    <input
      type="number"
      className={styles.numInput}
      value={draft}
      min={min}
      max={max}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
      }}
    />
  );
}

// ──────────────────────────────────────
// 색상+굵기 팝오버 버튼
// ──────────────────────────────────────
function ColorPopoverBtn({
  color,
  lineWidth,
  onColorChange,
  onWidthChange,
}: {
  color: string;
  lineWidth: 1 | 2 | 3 | 4;
  onColorChange: (c: string) => void;
  onWidthChange: (w: 1 | 2 | 3 | 4) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className={styles.colorPopoverWrap} ref={ref}>
      <button
        type="button"
        className={styles.colorBtn}
        onClick={() => setOpen((v) => !v)}
        title="색상·굵기 변경"
      >
        <span className={styles.colorSwatch} style={{ background: color }} />
        <span className={styles.colorBtnLabel}>{lineWidth}px</span>
      </button>

      {open && (
        <div className={styles.colorPopover} onMouseDown={(e) => e.stopPropagation()}>
          {/* 색상 팔레트 */}
          <div className={styles.popoverSection}>컬러</div>
          <div className={styles.palette}>
            {PALETTE_COLORS.map((row, ri) => (
              <div key={ri} className={styles.paletteRow}>
                {row.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`${styles.paletteCell} ${color === c ? styles.paletteCellActive : ''}`}
                    style={{ background: c }}
                    onClick={() => onColorChange(c)}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* 굵기 선택 */}
          <div className={styles.popoverSection}>굵기</div>
          <div className={styles.widthRow}>
            {LINE_WIDTHS.map((w) => (
              <button
                key={w}
                type="button"
                className={`${styles.widthCell} ${lineWidth === w ? styles.widthCellActive : ''}`}
                onClick={() => {
                  onWidthChange(w);
                  setOpen(false);
                }}
              >
                <span
                  className={styles.widthLine}
                  style={{ height: w, background: color }}
                />
                <span className={styles.widthLabel}>{w}px</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────
// 소스 선택
// ──────────────────────────────────────
function SourceSelect({
  value,
  onChange,
}: {
  value: IndicatorSource;
  onChange: (v: IndicatorSource) => void;
}) {
  return (
    <select
      className={styles.sourceSelect}
      value={value}
      onChange={(e) => onChange(e.target.value as IndicatorSource)}
    >
      {(Object.keys(SOURCE_LABELS) as IndicatorSource[]).map((k) => (
        <option key={k} value={k}>
          {SOURCE_LABELS[k]}
        </option>
      ))}
    </select>
  );
}

// ──────────────────────────────────────
// 메인 컴포넌트
// ──────────────────────────────────────
export default function IndicatorPanel({
  options,
  onChange,
  onReset,
}: IndicatorPanelProps) {
  const [open, setOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<IndicatorKey>('sma');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function updateConfig(
    id: string,
    patch: Partial<UpperIndicatorConfig | LowerIndicatorConfig>,
  ) {
    onChange({
      upper: options.upper.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      lower: options.lower.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    } as IndicatorOptions);
  }

  function addSma() {
    const smas = options.upper.filter((c) => c.type === 'sma') as SmaConfig[];
    const newSma = createSmaConfig(smas);
    onChange({ ...options, upper: [...options.upper, newSma] });
  }

  function removeSma(id: string) {
    onChange({ ...options, upper: options.upper.filter((c) => c.id !== id) });
  }

  // key에 속한 지표 중 하나라도 enabled인지
  function isActive(key: IndicatorKey): boolean {
    return [...options.upper, ...options.lower].some((c) => c.type === key && c.enabled);
  }

  // 좌측 체크 버튼 토글 — SMA는 전체 일괄, 나머지는 단일
  function toggleKey(key: IndicatorKey) {
    const nextEnabled = !isActive(key);
    if (key === 'sma') {
      onChange({
        ...options,
        upper: options.upper.map((c) =>
          c.type === 'sma' ? { ...c, enabled: nextEnabled } : c,
        ),
      });
    } else {
      onChange({
        upper: options.upper.map((c) =>
          c.type === key ? { ...c, enabled: nextEnabled } : c,
        ),
        lower: options.lower.map((c) =>
          c.type === key ? { ...c, enabled: nextEnabled } : c,
        ),
      } as IndicatorOptions);
    }
  }

  // ── 우측 패널 렌더 ──
  function renderRightPane() {
    switch (selectedKey) {
      case 'sma':
        return renderSmaRight();
      case 'ema':
        return renderEmaRight();
      case 'bollinger':
        return renderBollingerRight();
      case 'envelope':
        return renderEnvelopeRight();
      case 'volume':
        return renderVolumeRight();
      case 'rsi':
        return renderRsiRight();
      case 'macd':
        return renderMacdRight();
    }
  }

  // ── SMA ──
  function renderSmaRight() {
    const smas = options.upper.filter((c) => c.type === 'sma') as SmaConfig[];
    return (
      <>
        <div className={styles.rightHeader}>
          <div className={styles.rightTitle}>이동평균선</div>
          <div className={styles.rightSubtitle}>지난 n일 동안 주가 평균값을 이은 선</div>
        </div>

        {smas.map((c, i) => (
          <div key={c.id} className={styles.smaRow}>
            <span className={styles.smaRowLabel}>기간{i + 1}</span>
            <ColorPopoverBtn
              color={c.color}
              lineWidth={c.lineWidth ?? 1}
              onColorChange={(v) => updateConfig(c.id, { color: v })}
              onWidthChange={(v) => updateConfig(c.id, { lineWidth: v })}
            />
            <SourceSelect
              value={c.source ?? 'close'}
              onChange={(v) => updateConfig(c.id, { source: v })}
            />
            <NumInput
              value={c.period}
              min={1}
              max={500}
              onCommit={(v) => updateConfig(c.id, { period: v })}
            />
            {/* 첫 번째 항목은 삭제 불가 — 빈 자리만 차지 */}
            {i === 0 ? (
              <span className={styles.removePlaceholder} />
            ) : (
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeSma(c.id)}
                title="삭제"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M1 1L9 9M9 1L1 9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </div>
        ))}

        <button type="button" className={styles.addBtn} onClick={addSma}>
          <span className={styles.addBtnCircle}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M5 1V9M1 5H9"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
          기간 추가
        </button>
      </>
    );
  }

  // ── EMA ──
  function renderEmaRight() {
    const ema = options.upper.find((c) => c.type === 'ema') as EmaConfig | undefined;
    return (
      <>
        <div className={styles.rightHeader}>
          <div className={styles.rightTitle}>지수이동평균선</div>
          <div className={styles.rightSubtitle}>
            최근 데이터에 더 많은 가중치를 부여한 이동평균
          </div>
        </div>
        {ema && (
          <>
            <div className={styles.switchRow}>
              <span className={styles.switchLabel}>표시</span>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={ema.enabled}
                  onChange={() => updateConfig(ema.id, { enabled: !ema.enabled })}
                />
                <span className={styles.switchSlider} />
              </label>
            </div>
            <div className={styles.smaRow}>
              <span className={styles.smaRowLabel}>기간</span>
              <ColorPopoverBtn
                color={ema.color}
                lineWidth={ema.lineWidth ?? 1}
                onColorChange={(v) => updateConfig(ema.id, { color: v })}
                onWidthChange={(v) => updateConfig(ema.id, { lineWidth: v })}
              />
              <SourceSelect
                value={ema.source ?? 'close'}
                onChange={(v) => updateConfig(ema.id, { source: v })}
              />
              <NumInput
                value={ema.period}
                min={1}
                max={500}
                onCommit={(v) => updateConfig(ema.id, { period: v })}
              />
            </div>
          </>
        )}
      </>
    );
  }

  // ── 볼린저밴드 ──
  function renderBollingerRight() {
    const bb = options.upper.find((c) => c.type === 'bollinger') as
      | BollingerConfig
      | undefined;
    return (
      <>
        <div className={styles.rightHeader}>
          <div className={styles.rightTitle}>볼린저밴드</div>
          <div className={styles.rightSubtitle}>
            이동평균선 기준 표준편차 상/하단 밴드
          </div>
        </div>
        {bb && (
          <>
            <div className={styles.switchRow}>
              <span className={styles.switchLabel}>표시</span>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={bb.enabled}
                  onChange={() => updateConfig(bb.id, { enabled: !bb.enabled })}
                />
                <span className={styles.switchSlider} />
              </label>
            </div>
            <div className={styles.paramRow}>
              <span className={styles.paramLabel}>기간</span>
              <NumInput
                value={bb.period}
                min={1}
                max={500}
                onCommit={(v) => updateConfig(bb.id, { period: v })}
              />
            </div>
            <div className={styles.paramRow}>
              <span className={styles.paramLabel}>배수</span>
              <NumInput
                value={bb.k}
                min={0.1}
                max={10}
                onCommit={(v) => updateConfig(bb.id, { k: v })}
              />
            </div>
            <div className={styles.paramRow}>
              <span className={styles.paramLabel}>색상</span>
              <ColorPopoverBtn
                color={bb.lineColor}
                lineWidth={1}
                onColorChange={(v) =>
                  updateConfig(bb.id, { lineColor: v, fillColor: v + '1a' })
                }
                onWidthChange={() => {}}
              />
            </div>
          </>
        )}
      </>
    );
  }

  // ── 엔벨로프 ──
  function renderEnvelopeRight() {
    const env = options.upper.find((c) => c.type === 'envelope') as
      | EnvelopeConfig
      | undefined;
    return (
      <>
        <div className={styles.rightHeader}>
          <div className={styles.rightTitle}>엔벨로프</div>
          <div className={styles.rightSubtitle}>
            이동평균선 기준 일정 비율 상/하단 채널
          </div>
        </div>
        {env && (
          <>
            <div className={styles.switchRow}>
              <span className={styles.switchLabel}>표시</span>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={env.enabled}
                  onChange={() => updateConfig(env.id, { enabled: !env.enabled })}
                />
                <span className={styles.switchSlider} />
              </label>
            </div>
            <div className={styles.paramRow}>
              <span className={styles.paramLabel}>기간</span>
              <NumInput
                value={env.period}
                min={1}
                max={500}
                onCommit={(v) => updateConfig(env.id, { period: v })}
              />
            </div>
            <div className={styles.paramRow}>
              <span className={styles.paramLabel}>비율(%)</span>
              <NumInput
                value={Math.round(env.percent * 100)}
                min={1}
                max={50}
                onCommit={(v) => updateConfig(env.id, { percent: v / 100 })}
              />
            </div>
            <div className={styles.paramRow}>
              <span className={styles.paramLabel}>색상</span>
              <ColorPopoverBtn
                color={env.lineColor}
                lineWidth={1}
                onColorChange={(v) =>
                  updateConfig(env.id, { lineColor: v, fillColor: v + '1a' })
                }
                onWidthChange={() => {}}
              />
            </div>
          </>
        )}
      </>
    );
  }

  // ── 거래량 ──
  function renderVolumeRight() {
    const vol = options.lower.find((c) => c.type === 'volume');
    return (
      <>
        <div className={styles.rightHeader}>
          <div className={styles.rightTitle}>거래량</div>
          <div className={styles.rightSubtitle}>각 캔들의 거래 체결량 막대</div>
        </div>
        {vol && (
          <div className={styles.switchRow}>
            <span className={styles.switchLabel}>표시</span>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={vol.enabled}
                onChange={() => updateConfig(vol.id, { enabled: !vol.enabled })}
              />
              <span className={styles.switchSlider} />
            </label>
          </div>
        )}
      </>
    );
  }

  // ── RSI ──
  function renderRsiRight() {
    const rsi = options.lower.find((c) => c.type === 'rsi') as RsiConfig | undefined;
    return (
      <>
        <div className={styles.rightHeader}>
          <div className={styles.rightTitle}>RSI</div>
          <div className={styles.rightSubtitle}>과매수/과매도 구간을 0~100으로 표시</div>
        </div>
        {rsi && (
          <>
            <div className={styles.switchRow}>
              <span className={styles.switchLabel}>표시</span>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={rsi.enabled}
                  onChange={() => updateConfig(rsi.id, { enabled: !rsi.enabled })}
                />
                <span className={styles.switchSlider} />
              </label>
            </div>
            <div className={styles.paramRow}>
              <span className={styles.paramLabel}>기간</span>
              <NumInput
                value={rsi.period}
                min={2}
                max={200}
                onCommit={(v) => updateConfig(rsi.id, { period: v })}
              />
            </div>
          </>
        )}
      </>
    );
  }

  // ── MACD ──
  function renderMacdRight() {
    const macd = options.lower.find((c) => c.type === 'macd') as MacdConfig | undefined;
    return (
      <>
        <div className={styles.rightHeader}>
          <div className={styles.rightTitle}>MACD</div>
          <div className={styles.rightSubtitle}>
            단기·장기 이동평균 차이로 추세 강도 측정
          </div>
        </div>
        {macd && (
          <>
            <div className={styles.switchRow}>
              <span className={styles.switchLabel}>표시</span>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={macd.enabled}
                  onChange={() => updateConfig(macd.id, { enabled: !macd.enabled })}
                />
                <span className={styles.switchSlider} />
              </label>
            </div>
            <div className={styles.paramRow}>
              <span className={styles.paramLabel}>단기</span>
              <NumInput
                value={macd.fastPeriod}
                min={1}
                max={100}
                onCommit={(v) => updateConfig(macd.id, { fastPeriod: v })}
              />
            </div>
            <div className={styles.paramRow}>
              <span className={styles.paramLabel}>장기</span>
              <NumInput
                value={macd.slowPeriod}
                min={1}
                max={200}
                onCommit={(v) => updateConfig(macd.id, { slowPeriod: v })}
              />
            </div>
            <div className={styles.paramRow}>
              <span className={styles.paramLabel}>시그널</span>
              <NumInput
                value={macd.signalPeriod}
                min={1}
                max={100}
                onCommit={(v) => updateConfig(macd.id, { signalPeriod: v })}
              />
            </div>
          </>
        )}
      </>
    );
  }

  return (
    <div className={styles.wrapper} ref={panelRef}>
      <button
        className={`${styles.triggerBtn} ${open ? styles.open : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        지표
        <svg
          className={`${styles.triggerChevron} ${open ? styles.chevronUp : ''}`}
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
        >
          <path
            d="M1 1L5 5L9 1"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className={styles.panel}>
          {/* 좌측 목록 */}
          <div className={styles.leftPane}>
            <div className={styles.leftSectionTitle}>상단 지표</div>
            {UPPER_ITEMS.map(({ key, label }) => {
              const active = isActive(key);
              return (
                <div
                  key={key}
                  className={`${styles.leftItem} ${selectedKey === key ? styles.selected : ''}`}
                  onClick={() => setSelectedKey(key)}
                >
                  <span className={styles.leftItemLabel}>{label}</span>
                  <button
                    type="button"
                    className={`${styles.toggleBtn} ${active ? styles.toggleBtnOn : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleKey(key);
                    }}
                    title={active ? '비활성화' : '활성화'}
                  >
                    <svg width="8" height="7" viewBox="0 0 8 7" fill="none">
                      <path
                        d="M1 3.5L3 5.5L7 1"
                        stroke={active ? 'white' : 'var(--grey500)'}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              );
            })}

            <div className={styles.leftDivider} />
            <div className={styles.leftSectionTitle}>하단 지표</div>

            {LOWER_ITEMS.map(({ key, label }) => {
              const active = isActive(key);
              return (
                <div
                  key={key}
                  className={`${styles.leftItem} ${selectedKey === key ? styles.selected : ''}`}
                  onClick={() => setSelectedKey(key)}
                >
                  <span className={styles.leftItemLabel}>{label}</span>
                  <button
                    type="button"
                    className={`${styles.toggleBtn} ${active ? styles.toggleBtnOn : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleKey(key);
                    }}
                    title={active ? '비활성화' : '활성화'}
                  >
                    <svg width="8" height="7" viewBox="0 0 8 7" fill="none">
                      <path
                        d="M1 3.5L3 5.5L7 1"
                        stroke={active ? 'white' : 'var(--grey500)'}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>

          {/* 우측 편집 */}
          <div className={styles.rightPane}>
            <div
              className={`${styles.rightContent} ${!isActive(selectedKey) ? styles.rightDisabled : ''}`}
            >
              {renderRightPane()}
            </div>
            <div className={styles.resetRow}>
              <button className={styles.resetBtn} onClick={onReset}>
                초기화
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
