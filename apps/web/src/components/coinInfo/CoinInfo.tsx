'use client';

import { useTicker } from '@/hooks/useTicker';
import PriceRangeMeter from './PriceRangeMeter';
import styles from './styles/coin.info.module.css';
import { createKrwPriceFormatter } from '@/utils/formatting/price';

const clamp = (n: number) => {
  return Math.min(100, Math.max(0, n));
};

const getRangePercent = (value: number, high: number, low: number) => {
  const range = high - low;

  if (!Number.isFinite(range) || range <= 0) return 0;

  return clamp(((value - low) / range) * 100);
};

const CoinInfo = ({ code }: { code: string }) => {
  return (
    <div className={styles.coinInfo}>
      <PriceRanges code={code} />
    </div>
  );
};

const PriceRanges = ({ code }: { code: string }) => {
  const ticker = useTicker(code);

  if (!ticker) return null;

  const todayPercent = getRangePercent(
    ticker.tradePrice,
    ticker.highPrice,
    ticker.lowPrice,
  );

  const yearPercent = getRangePercent(
    ticker.tradePrice,
    ticker.highest52WeekPrice,
    ticker.lowest52WeekPrice,
  );

  const formatter = createKrwPriceFormatter(ticker.tradePrice);

  return (
    <div className={styles.priceRanges}>
      <div className={styles.priceRange}>
        <PriceRangeMeter percent={todayPercent} />
        <div className={styles.priceRangeInfo}>
          <div className={styles.priceRangeItem}>
            <span>1일 최저</span>
            <p>{formatter.formatPrice(ticker.lowPrice)}</p>
          </div>
          <div className={styles.priceRangeItem}>
            <span>1일 최고</span>
            <p>{formatter.formatPrice(ticker.highPrice)}</p>
          </div>
        </div>
      </div>
      <div className={styles.priceRange}>
        <PriceRangeMeter percent={yearPercent} />
        <div className={styles.priceRangeInfo}>
          <div className={styles.priceRangeItem}>
            <span>1년 최저</span>
            <p>{formatter.formatPrice(ticker.lowest52WeekPrice)}</p>
          </div>
          <div className={styles.priceRangeItem}>
            <span>1년 최고</span>
            <p>{formatter.formatPrice(ticker.highest52WeekPrice)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoinInfo;
