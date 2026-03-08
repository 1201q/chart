'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './MainPageListHeader.module.css';
import type { SortDir, SortKey } from '@/types/view.types';

/* ==================== 드롭다운 옵션 (< 450px) ==================== */

interface SortOption {
  label: string;
  key: SortKey;
  dir: SortDir;
}

const SORT_OPTIONS: SortOption[] = [
  { label: '거래대금 높은 순', key: 'acc', dir: 'desc' },
  { label: '거래대금 낮은 순', key: 'acc', dir: 'asc' },
  { label: '가나다 순', key: 'name', dir: 'asc' },
  { label: '현재가 높은 순', key: 'price', dir: 'desc' },
  { label: '현재가 낮은 순', key: 'price', dir: 'asc' },
  { label: '등락률 높은 순', key: 'changeRate', dir: 'desc' },
  { label: '등락률 낮은 순', key: 'changeRate', dir: 'asc' },
];

function getCurrentLabel(sortBy: SortKey, sortDir: SortDir): string {
  const match = SORT_OPTIONS.find((o) => o.key === sortBy && o.dir === sortDir);
  return match?.label ?? '거래대금 높은 순';
}

/* ==================== 컬럼 정렬 버튼 (≥ 450px) ==================== */

interface SortFieldProps {
  label: string;
  mobileLabel?: string;
  field: SortKey;
  currentSort: SortKey | null;
  currentDir: SortDir | null;
  onClick: () => void;
}

const SortField = ({
  label,
  mobileLabel,
  field,
  currentSort,
  currentDir,
  onClick,
}: SortFieldProps) => {
  const isActive = currentSort === field;

  return (
    <button
      className={styles.sortField}
      data-active={isActive}
      onClick={onClick}
      type="button"
    >
      <span className={styles.sortLabel} data-active={isActive}>
        {mobileLabel ? (
          <>
            <span className={styles.labelDesktop}>{label}</span>
            <span className={styles.labelMobile}>{mobileLabel}</span>
          </>
        ) : (
          label
        )}
      </span>
      <div
        className={styles.sortIcon}
        data-active={isActive}
        data-dir={isActive ? currentDir : undefined}
      >
        <svg width="10" height="10" viewBox="0 0 10 10">
          <path d="M5 0L9.33013 3.75H0.669871L5 0Z" className={styles.sortUp} />
          <path d="M5 10L0.669871 6.25H9.33013L5 10Z" className={styles.sortDown} />
        </svg>
      </div>
    </button>
  );
};

/* ==================== MainPageListHeader ==================== */

interface MainPageListHeaderProps {
  sortBy: SortKey;
  sortDirection: SortDir;
  onSortChange: (field: SortKey) => void;
  onSortExplicit: (key: SortKey, dir: SortDir) => void;
}

const MainPageListHeader = ({
  sortBy,
  sortDirection,
  onSortChange,
  onSortExplicit,
}: MainPageListHeaderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => setIsOpen(false);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  const handleSelect = (key: SortKey, dir: SortDir) => {
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
            <span className={styles.sortButtonLabel}>
              {getCurrentLabel(sortBy, sortDirection)}
            </span>
            <ChevronDown size={13} className={styles.chevron} data-open={isOpen} />
          </button>

          {isOpen && (
            <>
            <div className={styles.backdrop} onClick={() => setIsOpen(false)} />
            <div className={styles.dropdownMenu}>
              {SORT_OPTIONS.map((opt) => {
                const isActive = opt.key === sortBy && opt.dir === sortDirection;
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

      {/* ≥ 450px: 기존 컬럼 헤더 */}
      <div className={styles.header}>
        <SortField
          label="이름"
          field="name"
          currentSort={sortBy}
          currentDir={sortDirection}
          onClick={() => onSortChange('name')}
        />
        <SortField
          label="현재가"
          field="price"
          currentSort={sortBy}
          currentDir={sortDirection}
          onClick={() => onSortChange('price')}
        />
        <SortField
          label="24h 변동"
          mobileLabel="등락률"
          field="changeRate"
          currentSort={sortBy}
          currentDir={sortDirection}
          onClick={() => onSortChange('changeRate')}
        />
        <SortField
          label="24h 거래대금"
          mobileLabel="거래대금"
          field="acc"
          currentSort={sortBy}
          currentDir={sortDirection}
          onClick={() => onSortChange('acc')}
        />
        <div className={`${styles.headerCell} ${styles.highLowHeaderCell}`}>
          <span className={styles.headerLabel}>24h 고가/저가</span>
        </div>
      </div>
    </>
  );
};

export default MainPageListHeader;
