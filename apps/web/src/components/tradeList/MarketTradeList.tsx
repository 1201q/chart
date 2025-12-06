'use client';

import styles from './styles/market.trade.module.css';

import { useTrades } from '@/hooks/useTrades';
import MarketTradeListItem from './MarketTradeListItem';

const MarketTradeList = () => {
  const trades = useTrades();

  if (trades.length === 0) return null;

  return (
    <ul className={styles.tradeList}>
      {trades.map((t, index) => (
        <MarketTradeListItem
          key={`${t.sequentialId}-${t.tradePrice}-${t.tradeVolume}-${index}`}
          trade={t}
        />
      ))}
    </ul>
  );
};

export default MarketTradeList;
