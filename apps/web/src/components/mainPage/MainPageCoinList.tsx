'use client';

import {
  useTickerStore,
  useTickerListView,
  useVisibleTickerCodes,
} from '@/hooks/uses/tickers.hooks';
import MainPageTabs from './MainPageTabs';
import MainPageListHeader from './MainPageListHeader';
import MainPageCoinRow from './MainPageCoinRow';
import styles from './MainPageCoinList.module.css';
import type { FilterMode, SortKey } from '@/types/view.types';
import { useIsAuthenticated } from '@/utils/context/auth.context';

const LOGIN_REQUIRED_FILTERS: FilterMode[] = ['watchlist', 'holding'];

const MainPageCoinList = () => {
  const store = useTickerStore();
  const tickerListView = useTickerListView();
  const visibleCodes = useVisibleTickerCodes();
  const isAuthenticated = useIsAuthenticated();

  const handleFilterChange = (filter: FilterMode) => {
    store.setFilter(filter);
  };

  const handleSortChange = (field: SortKey) => {
    store.setSort(field);
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
          />

          <div className={styles.rowsContainer}>
            {visibleCodes.map((code) => (
              <MainPageCoinRow key={code} code={code} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MainPageCoinList;
