'use client';

import styles from '../styles/market.trade.module.css';

import MarketTradeListItem from './NewMarketTradeListItem';
import { useTrades } from '@/hooks/trades.hooks';

const MarketTradeList = () => {
  const trades = useTrades();

  if (!trades.length) return <Skeleton />;

  return (
    <ul className={styles.tradeList}>
      {trades.map((t) => (
        <MarketTradeListItem key={t.id} trade={t} />
      ))}
    </ul>
  );
};

const Skeleton = () => {
  const mockItems = Array.from({ length: 18 }).map((_, i) => i);

  return (
    <ul className={styles.tradeList}>
      {mockItems.map((i, index) => (
        <li
          key={index}
          className={`${index % 2 === 0 ? 'sk' : ''} ${styles.tradeListItem} ${styles.skeleton}`}
        ></li>
      ))}
    </ul>
  );
};

export default MarketTradeList;
