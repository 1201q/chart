'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './MainPageTabs.module.css';
import type { FilterMode } from '@/types/view.types';

interface MainPageTabsProps {
  activeFilter: FilterMode;
  onFilterChange: (filter: FilterMode) => void;
  query?: string;
  onQueryChange?: (q: string) => void;
}

const TABS: { id: FilterMode; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'watchlist', label: '즐겨찾기' },
  { id: 'holding', label: '보유' },
];

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M10 10L13.5 13.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const CloseIcon = () => (
  <svg width="8" height="8" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path
      d="M1 1L11 11M11 1L1 11"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const MainPageTabs = ({
  activeFilter,
  onFilterChange,
  query = '',
  onQueryChange,
}: MainPageTabsProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [localValue, setLocalValue] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const isComposingRef = useRef(false);

  // 외부에서 query가 초기화될 때(예: 닫기) 로컬값도 동기화
  useEffect(() => {
    if (!isComposingRef.current) {
      setLocalValue(query);
    }
  }, [query]);

  const openSearch = () => {
    setIsSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    onQueryChange?.('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    if (!isComposingRef.current) {
      onQueryChange?.(e.target.value);
    }
  };

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false;
    onQueryChange?.((e.target as HTMLInputElement).value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') closeSearch();
  };

  return (
    <div
      className={`${styles.tabsWrapper} ${isSearchOpen ? styles.searchOpenWrapper : ''}`}
    >
      <div className={styles.tabsLeft}>
        {TABS.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              className={`${styles.tab} ${isActive ? styles.activeTab : ''}`}
              onClick={() => onFilterChange(tab.id)}
              type="button"
            >
              <span className={styles.label}>{tab.label}</span>
              {isActive && <div className={styles.pill} />}
            </button>
          );
        })}
      </div>

      {onQueryChange && (
        <div
          className={`${styles.searchArea} ${isSearchOpen ? styles.searchAreaOpen : ''}`}
        >
          <button
            className={styles.searchIconBtn}
            onClick={openSearch}
            type="button"
            aria-label="검색"
            tabIndex={-1}
          >
            <SearchIcon />
          </button>
          <input
            ref={inputRef}
            className={`${styles.searchInput} ${isSearchOpen ? styles.searchInputVisible : ''}`}
            type="text"
            value={localValue}
            onChange={handleChange}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onKeyDown={handleKeyDown}
            placeholder="코인 검색"
            tabIndex={0}
          />
          <button
            className={`${styles.closeBtn} ${isSearchOpen ? styles.closeBtnVisible : ''}`}
            onClick={closeSearch}
            type="button"
            aria-label="검색 닫기"
            tabIndex={isSearchOpen ? 0 : -1}
          >
            <CloseIcon />
          </button>
        </div>
      )}
    </div>
  );
};

export default MainPageTabs;
