'use client';

import { useTicker } from '@/hooks/useTicker';
import styles from './styles/exchange.header.module.css';
import { createKrwPriceFormatter } from '@/utils/formatting/price';
import { formatChangeRate } from '@/utils/formatting/changeRate';

const ExchangeHeader = ({ code }: { code: string }) => {
  const ticker = useTicker(code);

  if (!ticker) return null;

  const priceFormatter = createKrwPriceFormatter(ticker.tradePrice);
  const change = priceFormatter.formatDiffParts(ticker.signedChangePrice);

  return (
    <div className={styles.exchangeHeader}>
      <div className={styles.topWrapper}>
        <h3 className={styles.coinTitleText}>{ticker.koreanName}</h3>
        <div className={styles.badge}>
          <p>{ticker.code.replace('KRW-', '')}</p>
        </div>
      </div>
      <div className={styles.bottomWrapper}>
        <h2 className={styles.coinPriceText}>
          {priceFormatter.formatPrice(ticker.tradePrice)}원
        </h2>
        <div className={styles.changeWrapper}>
          <span className={styles.changeText}>어제보다</span>
          <span
            className={`${styles.changeRumericText} ${ticker.change === 'RISE' ? styles.rise : ticker.change === 'FALL' ? styles.fall : styles.even}`}
          >
            {change.sign}
            {change.numeric} ({formatChangeRate(ticker.changeRate)}
            %)
          </span>
        </div>
      </div>
    </div>
  );
};

export default ExchangeHeader;
