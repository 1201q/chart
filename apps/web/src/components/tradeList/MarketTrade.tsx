'use client';

import styles from './styles/market.trade.module.css';
import MarketTradeList from './MarketTradeList';

const MarketTrade = () => {
  return (
    <div className={styles.trades}>
      <div className={styles.tradeListHeader}>
        <span className={styles.headerCell}>시간</span>
        <span className={styles.headerCell}>체결가격</span>
        <span className={styles.headerCell}>체결액(KRW)</span>
      </div>

      <MarketTradeList />
    </div>
  );
};

export default MarketTrade;
