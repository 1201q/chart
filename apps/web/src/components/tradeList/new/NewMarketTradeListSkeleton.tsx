import styles from '../styles/market.trade.module.css';

const MarketTradeListSkeleton = () => {
  const mockItems = Array.from({ length: 18 }).map((_, i) => i);

  return (
    <div className={styles.trades}>
      <div className={styles.tradeListHeader}>
        <span className={styles.headerCell}>시간</span>
        <span className={styles.headerCell}>체결가격</span>
        <span className={styles.headerCell}>체결액(KRW)</span>
      </div>
      <ul className={styles.tradeList}>
        {mockItems.map((i, index) => (
          <li
            key={index}
            className={`${index % 2 === 0 ? 'sk' : ''} ${styles.tradeListItem} ${styles.skeleton}`}
          ></li>
        ))}
      </ul>
    </div>
  );
};

export default MarketTradeListSkeleton;
