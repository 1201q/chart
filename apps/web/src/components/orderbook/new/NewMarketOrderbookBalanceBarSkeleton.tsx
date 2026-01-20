import styles from '../styles/market.orderbook.balancebar.module.css';

const MarketOrderbookBalanceBarSkeleton = () => {
  return (
    <div className={styles.balancebar}>
      <div className={styles.track}>
        <span
          className={`sk ${styles.skeleton} ${styles.blue} ${styles.bar}`}
          style={{ transform: `translateX(${50}%)` }}
        ></span>
        <span
          className={`sk ${styles.skeleton} ${styles.bar} ${styles.red}`}
          style={{ transform: `translateX(-${50}%)` }}
        ></span>
      </div>
    </div>
  );
};

export default MarketOrderbookBalanceBarSkeleton;
