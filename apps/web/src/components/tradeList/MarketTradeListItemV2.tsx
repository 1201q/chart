'use client';

import { UpbitAskBid, UpbitChange } from '@chart/shared-types';
import styles from './styles/market.trade.module.css';
import { createKrwPriceFormatter } from '@/utils/formatting/price';

interface MarketTradeListItemProps {
  tradePrice: number;
  tradeTimestamp: number;
  change: UpbitChange;
  askBid: UpbitAskBid;
  tradeVolume: number;
}

const MarketTradeListItemV2 = ({
  tradePrice,
  tradeTimestamp,
  tradeVolume,
  askBid,
  change,
}: MarketTradeListItemProps) => {
  const priceFormatter = createKrwPriceFormatter(tradePrice);

  return (
    <li className={styles.tradeListItem}>
      <span className={`${styles.tradeCell} ${styles.timeText}`}>
        {new Date(tradeTimestamp).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Asia/Seoul',
        })}
      </span>
      <span
        className={`${styles.tradeCell} ${styles.priceText} ${change === 'RISE' ? styles.rise : change === 'FALL' ? styles.fall : styles.even}`}
      >
        {priceFormatter.formatPrice(tradePrice)}
      </span>

      <span
        className={`${styles.tradeCell} ${styles.priceText} ${askBid === 'ASK' ? styles.fall : styles.rise}`}
      >
        {(tradePrice * tradeVolume).toLocaleString('ko-KR', {
          maximumFractionDigits: 0,
        })}
      </span>
    </li>
  );
};

export default MarketTradeListItemV2;
