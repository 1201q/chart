/* eslint-disable react-hooks/refs */
'use client';

import { useRef } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import {
  useTickerStore,
  useTickerListView,
  useVisibleTickerCodes,
} from '@/hooks/uses/tickers.hooks';
import MainPageTabs from './MainPageTabs';
import MainPageListHeader from './MainPageListHeader';
import MainPageCoinRow from './MainPageCoinRow';
import styles from './MainPageCoinList.module.css';
import type { FilterMode, SortDir, SortKey } from '@/types/view.types';
import { useIsAuthenticated } from '@/utils/context/auth.context';

const LOGIN_REQUIRED_FILTERS: FilterMode[] = ['watchlist', 'holding'];

interface MainPageCoinListProps {
  virtualized?: boolean;
}

const MainPageCoinList = ({ virtualized = false }: MainPageCoinListProps) => {
  const store = useTickerStore();
  const tickerListView = useTickerListView();
  const visibleCodes = useVisibleTickerCodes();
  const isAuthenticated = useIsAuthenticated();

  const listRef = useRef<HTMLDivElement>(null);
  const virtualizer = useWindowVirtualizer({
    count: virtualized ? visibleCodes.length : 0,
    estimateSize: () => 52,
    overscan: 5,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  const handleFilterChange = (filter: FilterMode) => {
    store.setFilter(filter);
  };

  const handleSortChange = (field: SortKey) => {
    store.setSort(field);
  };

  const handleSortExplicit = (key: SortKey, dir: SortDir) => {
    store.setSortExplicit(key, dir);
  };

  const showLoginPrompt =
    !isAuthenticated && LOGIN_REQUIRED_FILTERS.includes(tickerListView.filter);

  return (
    <div className={styles.container}>
      <MainPageTabs
        activeFilter={tickerListView.filter}
        onFilterChange={handleFilterChange}
      />

      {showLoginPrompt ? (
        <div className={styles.loginPrompt}>
          <span className={styles.loginPromptText}>
            {tickerListView.filter === 'watchlist' ? (
              <>
                즐겨찾기를 보려면
                <br />
                로그인이 필요해요
              </>
            ) : (
              <>
                보유 자산을 보려면
                <br />
                로그인이 필요해요
              </>
            )}
          </span>
          <a href="/login" className={styles.loginPromptBtn}>
            로그인하기
          </a>
        </div>
      ) : (
        <div className={styles.listWrapper}>
          <MainPageListHeader
            sortBy={tickerListView.sortKey}
            sortDirection={tickerListView.dir}
            onSortChange={handleSortChange}
            onSortExplicit={handleSortExplicit}
          />

          {virtualized ? (
            <div
              ref={listRef}
              className={styles.rowsContainer}
              style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => (
                <div
                  key={virtualItem.key}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    transform: `translateY(${virtualItem.start - virtualizer.options.scrollMargin}px)`,
                  }}
                >
                  <MainPageCoinRow code={visibleCodes[virtualItem.index]} />
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.rowsContainer}>
              {visibleCodes.map((code) => (
                <MainPageCoinRow key={code} code={code} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MainPageCoinList;
