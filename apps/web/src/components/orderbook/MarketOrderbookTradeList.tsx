'use client';

import styles from './styles/market.orderbook.tradelist.module.css';
import { createKrwPriceFormatter } from '@/utils/formatting/price';

import { useTrades } from '@/hooks/useTrades';
import { UpbitAskBid } from '@chart/shared-types';
import { createKrwVolumeFormatter } from '@/utils/formatting/volume';
import { useTicker } from '@/hooks/useTicker';

interface RowProps {
  tradePrice: number;
  tradeVolume: number;
  askBid: UpbitAskBid;
}

const MarketOrderbookTradeList = ({ code }: { code: string }) => {
  const trades = useTrades();

  return (
    <div className={styles.tradeList}>
      <MarketOrderbookStrength code={code} />
      <ul className={styles.tradeListItemList}>
        {trades.map((t, index) => (
          <MarketOrderbookTradeListItem
            key={`${t.sequentialId}-${t.tradePrice}-${t.tradeVolume}-${index}`}
            tradePrice={t.tradePrice}
            tradeVolume={t.tradeVolume}
            askBid={t.askBid}
          />
        ))}
      </ul>
      {}
    </div>
  );
};

const MarketOrderbookTradeListItem = ({ tradePrice, tradeVolume, askBid }: RowProps) => {
  const priceFormatter = createKrwPriceFormatter(tradePrice);
  const volumeFormatter = createKrwVolumeFormatter(tradePrice);

  return (
    <li className={`${styles.tradeListItem}`}>
      <span className={styles.tradeListItemPrice}>
        {priceFormatter.formatPrice(tradePrice)}
      </span>
      <span
        className={`${styles.tradeListItemVolume} ${askBid === 'ASK' ? styles.fall : styles.rise}`}
      >
        {volumeFormatter.formatVolume(tradeVolume)}
      </span>
    </li>
  );
};

const MarketOrderbookStrength = ({ code }: { code: string }) => {
  const ticker = useTicker(code);

  const strength = ticker ? (ticker.accBidVolume / ticker.accAskVolume) * 100 : null;

  return (
    <div className={styles.strengthItem}>
      <span className={styles.strengthTitle}>체결강도</span>
      <span className={styles.strengthValue}>
        {strength ? `${strength?.toFixed(2)} %` : '-'}
      </span>
    </div>
  );
};

export default MarketOrderbookTradeList;
