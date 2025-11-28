import { MarketTrade } from '@chart/shared-types';
import styles from './styles/market.trade.module.css';
import { createKrwPriceFormatter } from '@/utils/formatting/price';

interface MarketTradeListProps {
  initialSnapshot: MarketTrade[];
}

const MarketTradeList = ({ initialSnapshot }: MarketTradeListProps) => {
  const sortedTrades = [...initialSnapshot].reverse();

  return (
    <ul className={styles.tradeList}>
      {sortedTrades.map((trade, index) => (
        <MarketTradeListItem
          key={`${trade.sequentialId}-${trade.tradeVolume}-${index}`}
          trade={trade}
        />
      ))}
    </ul>
  );
};

const MarketTradeListItem = ({ trade }: { trade: MarketTrade }) => {
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
        {priceFormatter.formatPrice(trade.tradePrice * trade.tradeVolume)}
      </span>
    </li>
  );
};

export default MarketTradeList;
