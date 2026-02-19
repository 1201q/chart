'use client';

import { useEffect, useRef, useState } from 'react';

import {
  BollingerConfig,
  EmaConfig,
  EnvelopeConfig,
  IndicatorOptions,
  LowerIndicatorConfig,
  MacdConfig,
  RsiConfig,
  SmaConfig,
  UpperIndicatorConfig,
} from '@/hooks/chart/indicatorTypes';

import styles from './IndicatorPanel.module.css';

interface IndicatorPanelProps {
  options: IndicatorOptions;
  onChange: (next: IndicatorOptions) => void;
  onReset: () => void;
}

// ──────────────────────────────────────
// 헬퍼: 숫자 입력 컴포넌트
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

  // 외부 value가 바뀌면 draft 동기화
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
      setDraft(String(value)); // 복원
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
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
      }}
    />
  );
}

// ──────────────────────────────────────
// 헬퍼: 색상 입력
// ──────────────────────────────────────
function ColorInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  // rgba → hex 변환 (color input은 hex만 지원)
  function toHex(color: string): string {
    if (color.startsWith('#')) return color.slice(0, 7);
    // rgba → canvas로 변환
    if (typeof document !== 'undefined') {
      const ctx = document.createElement('canvas').getContext('2d');
      if (ctx) {
        ctx.fillStyle = color;
        return ctx.fillStyle; // 브라우저가 hex로 정규화
      }
    }
    return '#000000';
  }

  return (
    <input
      type="color"
      className={styles.colorInput}
      value={toHex(value)}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

// ──────────────────────────────────────
// 메인 패널 컴포넌트
// ──────────────────────────────────────
export default function IndicatorPanel({
  options,
  onChange,
  onReset,
}: IndicatorPanelProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // 패널 외부 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (!panelRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // config 업데이트 헬퍼
  function updateConfig(
    id: string,
    patch: Partial<UpperIndicatorConfig | LowerIndicatorConfig>,
  ) {
    onChange({
      upper: options.upper.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      lower: options.lower.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    } as IndicatorOptions);
  }

  function toggleEnabled(id: string, current: boolean) {
    updateConfig(id, { enabled: !current });
  }

  // ── 상단 지표 행 렌더 ──
  function renderUpperRow(config: UpperIndicatorConfig) {
    const { id, enabled } = config;

    if (config.type === 'sma') {
      const c = config as SmaConfig;
      return (
        <div key={id} className={styles.row}>
          <button
            className={`${styles.toggleBtn} ${enabled ? styles.active : ''}`}
            onClick={() => toggleEnabled(id, enabled)}
            aria-label={`${id} ${enabled ? '비활성화' : '활성화'}`}
          />
          <span className={styles.label}>SMA {c.period}</span>
          <NumInput
            value={c.period}
            min={1}
            max={500}
            onCommit={(v) => updateConfig(id, { period: v })}
          />
          <ColorInput value={c.color} onChange={(v) => updateConfig(id, { color: v })} />
        </div>
      );
    }

    if (config.type === 'ema') {
      const c = config as EmaConfig;
      return (
        <div key={id} className={styles.row}>
          <button
            className={`${styles.toggleBtn} ${enabled ? styles.active : ''}`}
            onClick={() => toggleEnabled(id, enabled)}
            aria-label={`${id} ${enabled ? '비활성화' : '활성화'}`}
          />
          <span className={styles.label}>EMA {c.period}</span>
          <NumInput
            value={c.period}
            min={1}
            max={500}
            onCommit={(v) => updateConfig(id, { period: v })}
          />
          <ColorInput value={c.color} onChange={(v) => updateConfig(id, { color: v })} />
        </div>
      );
    }

    if (config.type === 'bollinger') {
      const c = config as BollingerConfig;
      return (
        <div key={id} className={styles.row}>
          <button
            className={`${styles.toggleBtn} ${enabled ? styles.active : ''}`}
            onClick={() => toggleEnabled(id, enabled)}
            aria-label={`볼린저밴드 ${enabled ? '비활성화' : '활성화'}`}
          />
          <span className={styles.label}>볼린저밴드</span>
          <span className={styles.paramLabel}>P</span>
          <NumInput
            value={c.period}
            min={1}
            max={500}
            onCommit={(v) => updateConfig(id, { period: v })}
          />
          <span className={styles.paramLabel}>K</span>
          <NumInput
            value={c.k}
            min={0.1}
            max={10}
            onCommit={(v) => updateConfig(id, { k: v })}
          />
          <ColorInput
            value={c.lineColor}
            onChange={(v) =>
              updateConfig(id, {
                lineColor: v,
                fillColor: v.startsWith('#') ? v + '1a' : v,
              })
            }
          />
        </div>
      );
    }

    if (config.type === 'envelope') {
      const c = config as EnvelopeConfig;
      return (
        <div key={id} className={styles.row}>
          <button
            className={`${styles.toggleBtn} ${enabled ? styles.active : ''}`}
            onClick={() => toggleEnabled(id, enabled)}
            aria-label={`엔벨로프 ${enabled ? '비활성화' : '활성화'}`}
          />
          <span className={styles.label}>엔벨로프</span>
          <span className={styles.paramLabel}>P</span>
          <NumInput
            value={c.period}
            min={1}
            max={500}
            onCommit={(v) => updateConfig(id, { period: v })}
          />
          <span className={styles.paramLabel}>%</span>
          <NumInput
            value={Math.round(c.percent * 100)}
            min={1}
            max={50}
            onCommit={(v) => updateConfig(id, { percent: v / 100 })}
          />
          <ColorInput
            value={c.lineColor}
            onChange={(v) =>
              updateConfig(id, {
                lineColor: v,
                fillColor: v.startsWith('#') ? v + '1a' : v,
              })
            }
          />
        </div>
      );
    }

    return null;
  }

  // ── 하단 지표 행 렌더 ──
  function renderLowerRow(config: LowerIndicatorConfig) {
    const { id, enabled } = config;

    if (config.type === 'volume') {
      return (
        <div key={id} className={styles.row}>
          <button
            className={`${styles.toggleBtn} ${enabled ? styles.active : ''}`}
            onClick={() => toggleEnabled(id, enabled)}
            aria-label={`거래량 ${enabled ? '비활성화' : '활성화'}`}
          />
          <span className={styles.label}>거래량</span>
        </div>
      );
    }

    if (config.type === 'rsi') {
      const c = config as RsiConfig;
      return (
        <div key={id} className={styles.row}>
          <button
            className={`${styles.toggleBtn} ${enabled ? styles.active : ''}`}
            onClick={() => toggleEnabled(id, enabled)}
            aria-label={`RSI ${enabled ? '비활성화' : '활성화'}`}
          />
          <span className={styles.label}>RSI</span>
          <span className={styles.paramLabel}>P</span>
          <NumInput
            value={c.period}
            min={2}
            max={200}
            onCommit={(v) => updateConfig(id, { period: v })}
          />
        </div>
      );
    }

    if (config.type === 'macd') {
      const c = config as MacdConfig;
      return (
        <div key={id} className={styles.row}>
          <button
            className={`${styles.toggleBtn} ${enabled ? styles.active : ''}`}
            onClick={() => toggleEnabled(id, enabled)}
            aria-label={`MACD ${enabled ? '비활성화' : '활성화'}`}
          />
          <span className={styles.label}>MACD</span>
          <span className={styles.paramLabel}>F</span>
          <NumInput
            value={c.fastPeriod}
            min={1}
            max={100}
            onCommit={(v) => updateConfig(id, { fastPeriod: v })}
          />
          <span className={styles.paramLabel}>S</span>
          <NumInput
            value={c.slowPeriod}
            min={1}
            max={200}
            onCommit={(v) => updateConfig(id, { slowPeriod: v })}
          />
          <span className={styles.paramLabel}>Sig</span>
          <NumInput
            value={c.signalPeriod}
            min={1}
            max={100}
            onCommit={(v) => updateConfig(id, { signalPeriod: v })}
          />
        </div>
      );
    }

    return null;
  }

  return (
    <div className={styles.wrapper} ref={panelRef}>
      <button
        className={`${styles.triggerBtn} ${open ? styles.open : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        지표 ▾
      </button>

      {open && (
        <div className={styles.panel}>
          {/* 상단 지표 */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>상단 지표</div>
            {options.upper.map((config) => renderUpperRow(config))}
          </div>

          <div className={styles.divider} />

          {/* 하단 지표 */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>하단 지표</div>
            {options.lower.map((config) => renderLowerRow(config))}
          </div>

          {/* 초기화 */}
          <button className={styles.resetBtn} onClick={onReset}>
            초기화
          </button>
        </div>
      )}
    </div>
  );
}
