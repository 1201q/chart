'use client';

import { MarketTickerWithNamesMap } from '@chart/shared-types';
import styles from './styles/coinlist.module.css';
import TickerList from './TickerList';

const SideCoinList = ({
  initialSnapshot,
}: {
  initialSnapshot: MarketTickerWithNamesMap;
}) => {
  return (
    <div className={styles.wrapper}>
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
          <button className={styles.listOptionButton}>
            <span>거래대금</span>
          </button>
        </div>
      </div>
      <ul className={styles.listWrapper}>
        <TickerList initialSnapshot={initialSnapshot} />
      </ul>
    </div>
  );
};

export default SideCoinList;
