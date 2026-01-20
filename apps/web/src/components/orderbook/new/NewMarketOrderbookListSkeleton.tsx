import styles from '../styles/market.orderbook.module.css';
import MarketOrderbookBalanceBarSkeleton from './NewMarketOrderbookBalanceBarSkeleton';

type RowProps = {
  type: 'blue' | 'red';
};

const MarketOrderbookListSkeleton = () => {
  const topRows = Array.from({ length: 15 }, (_, i) => i);
  const bottomRows = Array.from({ length: 15 }, (_, i) => i + 15);

  return (
    <div className={`${styles.orderbook} ${styles.skeleton}`}>
      <MarketOrderbookBalanceBarSkeleton />
      <div className={styles.topArea}>
        <div className={styles.topRows}>
          {topRows.map((i) => (
            <MarketOrderbookRow key={i} type={'blue'} />
          ))}
        </div>
        <div className={`${styles.info} ${styles.topInfo}`}>
          <MarketSideList />
        </div>
      </div>
      <div className={styles.divider}></div>
      <div className={styles.bottomArea}>
        <div className={`${styles.info}`}>
          <MarketSideList />
        </div>
        <div className={styles.bottomRows}>
          {bottomRows.map((i) => (
            <MarketOrderbookRow key={i} type={'red'} />
          ))}
        </div>
      </div>
    </div>
  );
};

const MarketOrderbookRow = ({ type }: RowProps) => {
  return (
    <div
      className={`${type === 'blue' ? styles.topRow : styles.bottomRow} ${styles.skeleton}`}
    >
      <div className={styles.skeletonCenter}>
        <div className={`sk ${styles.skeletonButton} ${styles.skeleton}`}></div>
      </div>
      <div className={styles.side}></div>
    </div>
  );
};

const MarketSideList = () => {
  return <div className={`sk ${styles.sideList} ${styles.skeleton}`}></div>;
};

export default MarketOrderbookListSkeleton;
