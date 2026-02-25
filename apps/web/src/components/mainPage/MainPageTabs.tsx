'use client';

import styles from './MainPageTabs.module.css';
import type { FilterMode } from '@/types/view.types';

interface MainPageTabsProps {
  activeFilter: FilterMode;
  onFilterChange: (filter: FilterMode) => void;
}

const TABS: { id: FilterMode; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'watchlist', label: '즐겨찾기' },
  { id: 'holding', label: '보유' },
];

const MainPageTabs = ({ activeFilter, onFilterChange }: MainPageTabsProps) => {
  return (
    <div className={styles.tabsWrapper}>
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
  );
};

export default MainPageTabs;
