'use client';

import { MarketTradeWithId } from '@chart/shared-types';
import styles from './styles/market.trade.module.css';
import { createKrwPriceFormatter } from '@/utils/formatting/price';

const MarketTradeListItem = ({ trade }: { trade: MarketTradeWithId }) => {
  const priceFormatter = createKrwPriceFormatter(trade.tradePrice);

  return (
    <li className={styles.tradeListItem}>
      <span className={`${styles.tradeCell} ${styles.timeText}`}>
        {new Date(trade.tradeTimestamp).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Asia/Seoul',
        })}
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
