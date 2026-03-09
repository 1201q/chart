'use client';

import { MarketTradeWithId } from '@chart/shared-types';
import styles from './styles/market.trade.module.css';
import { createKrwPriceFormatter } from '@/utils/formatting/price';

function formatSeoulTime(timestamp: number): string {
  const d = new Date(timestamp + 9 * 60 * 60 * 1000); // UTC → KST(+9)
  const h = String(d.getUTCHours()).padStart(2, '0');
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  const s = String(d.getUTCSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

const MarketTradeListItem = ({ trade }: { trade: MarketTradeWithId }) => {
  const priceFormatter = createKrwPriceFormatter(trade.tradePrice);

  return (
    <li className={styles.tradeListItem}>
      <span className={`${styles.tradeCell} ${styles.timeText}`}>
        {formatSeoulTime(trade.tradeTimestamp)}
      </span>
      <span
        className={`${styles.tradeCell} ${styles.priceText} ${trade.change === 'RISE' ? styles.rise : trade.change === 'FALL' ? styles.fall : styles.even}`}
      >
        {priceFormatter.formatPrice(trade.tradePrice)}
      </span>

      <span
        className={`${styles.tradeCell} ${styles.priceText} ${trade.askBid === 'ASK' ? styles.fall : styles.rise}`}
      >
        {(trade.tradePrice * trade.tradeVolume).toLocaleString('ko-KR', {
          maximumFractionDigits: 0,
        })}
      </span>
    </li>
  );
};

export default MarketTradeListItem;
