'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './MainPageHoldingListHeader.module.css';
import type { HoldingSort, HoldingSortKey, SortDir } from '@/types/view.types';

/* ==================== 드롭다운 옵션 (< 450px) ==================== */

interface SortOption {
  label: string;
  key: HoldingSortKey;
  dir: SortDir;
}

const SORT_OPTIONS: SortOption[] = [
  { label: '평가금액 높은 순', key: 'evalAmount', dir: 'desc' },
  { label: '평가금액 낮은 순', key: 'evalAmount', dir: 'asc' },
  { label: '가나다 순', key: 'name', dir: 'asc' },
  { label: '수익률 높은 순', key: 'profitRate', dir: 'desc' },
  { label: '수익률 낮은 순', key: 'profitRate', dir: 'asc' },
  { label: '평가손익 높은 순', key: 'profit', dir: 'desc' },
  { label: '평가손익 낮은 순', key: 'profit', dir: 'asc' },
];

function getCurrentLabel(sort: HoldingSort): string {
  const match = SORT_OPTIONS.find((o) => o.key === sort.key && o.dir === sort.dir);
  return match?.label ?? '평가금액 높은 순';
}

/* ==================== 컬럼 정렬 버튼 (≥ 450px) ==================== */

interface SortFieldProps {
  label: string;
  field: HoldingSortKey;
  currentSort: HoldingSort;
  onClick: () => void;
}

const SortField = ({ label, field, currentSort, onClick }: SortFieldProps) => {
  const isActive = currentSort.key === field;

  return (
    <button
      className={styles.sortField}
      data-active={isActive}
      onClick={onClick}
      type="button"
    >
      <span className={styles.sortLabel} data-active={isActive}>
        {label}
      </span>
      <div
        className={styles.sortIcon}
        data-active={isActive}
        data-dir={isActive ? currentSort.dir : undefined}
      >
        <svg width="10" height="10" viewBox="0 0 10 10">
          <path d="M5 0L9.33013 3.75H0.669871L5 0Z" className={styles.sortUp} />
          <path d="M5 10L0.669871 6.25H9.33013L5 10Z" className={styles.sortDown} />
        </svg>
      </div>
    </button>
  );
};

/* ==================== MainPageHoldingListHeader ==================== */

interface MainPageHoldingListHeaderProps {
  sort: HoldingSort;
  onSortChange: (key: HoldingSortKey) => void;
  onSortExplicit: (key: HoldingSortKey, dir: SortDir) => void;
}

const MainPageHoldingListHeader = ({
  sort,
  onSortChange,
  onSortExplicit,
}: MainPageHoldingListHeaderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => setIsOpen(false);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  const handleSelect = (key: HoldingSortKey, dir: SortDir) => {
    onSortExplicit(key, dir);
    setIsOpen(false);
  };

  return (
    <>
      {/* < 450px: 드롭다운 버튼 */}
      <div className={styles.mobileHeader}>
        <div className={styles.sortDropdown} ref={ref}>
          <button
            className={styles.sortButton}
            onClick={() => setIsOpen((v) => !v)}
            type="button"
            data-open={isOpen}
          >
            <span className={styles.sortButtonLabel}>{getCurrentLabel(sort)}</span>
            <ChevronDown size={13} className={styles.chevron} data-open={isOpen} />
          </button>

          {isOpen && (
            <>
              <div className={styles.backdrop} onClick={() => setIsOpen(false)} />
              <div className={styles.dropdownMenu}>
                {SORT_OPTIONS.map((opt) => {
                  const isActive = opt.key === sort.key && opt.dir === sort.dir;
                  return (
                    <button
                      key={`${opt.key}-${opt.dir}`}
                      className={styles.dropdownItem}
                      data-active={isActive}
                      onClick={() => handleSelect(opt.key, opt.dir)}
                      type="button"
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ≥ 450px: 컬럼 헤더 */}
      <div className={styles.header}>
        <SortField
          label="이름"
          field="name"
          currentSort={sort}
          onClick={() => onSortChange('name')}
        />
        <SortField
          label="평가금액"
          field="evalAmount"
          currentSort={sort}
          onClick={() => onSortChange('evalAmount')}
        />
        <SortField
          label="수익률"
          field="profitRate"
          currentSort={sort}
          onClick={() => onSortChange('profitRate')}
        />
        <SortField
          label="평가손익"
          field="profit"
          currentSort={sort}
          onClick={() => onSortChange('profit')}
        />
        {/* 평균단가: ≥768px에서만 표시 */}
        <div className={`${styles.headerCell} ${styles.avgPriceHeader}`}>
          <span className={styles.headerLabel}>평균단가</span>
        </div>
      </div>
    </>
  );
};

export default MainPageHoldingListHeader;
