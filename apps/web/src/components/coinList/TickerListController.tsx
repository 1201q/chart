'use client';

import { useTickerListView, useTickerStore } from '@/hooks/uses/tickers.hooks';
import styles from './styles/ticker.controller.module.css';
import { SortKey, TickerListUiSort, TickerListView } from '@/types/view.types';

const TickerListController = () => {
  const store = useTickerStore();

  const tickerListView = useTickerListView();

  return (
    <div className={styles.listController}>
      <div className={styles.listTitle}>
        <h3>실시간</h3>
      </div>
      <div className={styles.menuButtons}>
        <button className={styles.menuButton}>
          <span>전체</span>
        </button>
        <button className={styles.menuButton}>
          <span>보유</span>
        </button>
        <button className={styles.menuButton}>
          <span>관심</span>
        </button>
      </div>
      <div className={styles.listHeader}>
        <div className={styles.listHeaderLeftWrapper}>
          <SortField
            label="자산명"
            k={'name'}
            sort={tickerListView['uiSort']}
            onClick={() => store.setSort('name')}
          />
        </div>
        <div className={styles.listHeaderRightWrapper}>
          <div className={styles.textWrapper}>
            <SortField
              label="현재가"
              k={'price'}
              sort={tickerListView['uiSort']}
              onClick={() => store.setSort('price')}
            />
            <SortField
              label="거대래금"
              k={'acc'}
              sort={tickerListView['uiSort']}
              onClick={() => store.setSort('acc')}
            />
          </div>
          <div className={styles.priceWrapper}>
            <SortField
              label="변동률"
              k={'changeRate'}
              sort={tickerListView['uiSort']}
              onClick={() => store.setSort('changeRate')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const SortField = ({
  label,
  k,
  sort,
  onClick,
}: {
  label: string;
  k: SortKey;
  sort: TickerListView['uiSort'];
  onClick: () => void;
}) => {
  const active = sort?.key === k;
  const dir = sort?.dir;

  return (
    <button className={styles.sortField} data-active={active} onClick={onClick}>
      <span className={styles.sortLabel} data-active={active}>
        {label}
      </span>
      <div className={styles.sortIcon} data-active={active} data-dir={dir}>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={styles.sortSvg}
        >
          <path d="M5 0L9.33013 3.75H0.669871L5 0Z" className={styles.sortUp} />
          <path d="M5 10L0.669871 6.25H9.33013L5 10Z" className={styles.sortDown} />
        </svg>
      </div>
    </button>
  );
};

export default TickerListController;
