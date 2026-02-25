'use client';

import styles from './MainPageListHeader.module.css';
import type { SortKey, SortDir } from '@/types/view.types';

interface MainPageListHeaderProps {
  sortBy: SortKey | null;
  sortDirection: SortDir | null;
  onSortChange: (field: SortKey) => void;
}

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

const MainPageListHeader = ({
  sortBy,
  sortDirection,
  onSortChange,
}: MainPageListHeaderProps) => {
  return (
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
  );
};

export default MainPageListHeader;
