'use client';

import { useEffect, useMemo } from 'react';
import styles from './styles/month.dropdown.module.css';
import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';

// 2025_02, 2025_12
type YM = { y: number; m: number; key: string; label: string };

function pad2(n: number) {
  return n.toString().padStart(2, '0');
}

// 2025-12 ~ now(현재월) 까지 생성
function buildMonths(from: { y: number; m: number }, to: { y: number; m: number }): YM[] {
  const out: YM[] = [];
  let y = from.y;
  let m = from.m;

  while (y < to.y || (y === to.y && m <= to.m)) {
    out.push({
      y,
      m,
      key: `${y}_${pad2(m)}`,
      label: `${y}년 ${m}월`,
    });

    m += 1;
    if (m === 13) {
      m = 1;
      y += 1;
    }
  }

  return out;
}

const MonthDropdown = ({
  currentRange,
  onClose,
  anchorRect,
  onSelect,
}: {
  currentRange: string;
  onSelect: (newRange: string) => void;
  onClose: () => void;
  anchorRect: DOMRect;
}) => {
  useEffect(() => {
    const onkeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onkeyDown);

    return () => {
      document.removeEventListener('keydown', onkeyDown);
    };
  }, [onClose]);

  const now = useMemo(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() + 1 };
  }, []);

  const months = useMemo(() => {
    return buildMonths({ y: 2025, m: 2 }, now).reverse();
  }, [now]);

  const top = Math.round(anchorRect.bottom + 8);
  const left = Math.round(anchorRect.left - 3);

  return createPortal(
    <div className={styles.bg} onMouseDown={onClose}>
      <div
        className={styles.panel}
        style={{ top, left }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <ul className={styles.panelWrapper}>
          {months.map((item) => {
            const active = currentRange === item.key;

            return (
              <li key={item.key} className={`${styles.option}`} data-active={active}>
                <button className={styles.optionRow} onClick={() => onSelect(item.key)}>
                  <span>{item.label}</span>
                  {active && <Check size={12} strokeWidth={3.5} />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>,
    document.body,
  );
};

export default MonthDropdown;
