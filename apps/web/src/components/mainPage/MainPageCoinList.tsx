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

const MainPageCoinList = () => {
  const store = useTickerStore();
  const tickerListView = useTickerListView();
  const visibleCodes = useVisibleTickerCodes();

  const handleFilterChange = (filter: FilterMode) => {
    store.setFilter(filter);
  };

  const handleSortChange = (field: SortKey) => {
    store.setSort(field);
  };

  return (
    <div className={styles.container}>
      <MainPageTabs
        activeFilter={tickerListView.filter}
        onFilterChange={handleFilterChange}
      />

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
    </div>
  );
};

export default MainPageCoinList;
