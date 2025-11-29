import { MarketTrade as MarketTradeType } from '@chart/shared-types';
import styles from './styles/market.trade.module.css';
import MarketTradeList from './MarketTradeList';

async function fetchTrades(code: string): Promise<MarketTradeType[]> {
  const res = await fetch(`http://localhost:8000/trades/${code}`, {
    cache: 'no-store',
  });
  return res.json();
}

const MarketTrade = async ({ code }: { code: string }) => {
  const data = await fetchTrades(code);

  return (
    <div className={styles.trades}>
      <div className={styles.tradeListHeader}>
        <span className={styles.headerCell}>시간</span>
        <span className={styles.headerCell}>체결가격</span>
        <span className={styles.headerCell}>체결액(KRW)</span>
      </div>

      <MarketTradeList code={code} initialSnapshot={data} />
    </div>
  );
};

export default MarketTrade;
