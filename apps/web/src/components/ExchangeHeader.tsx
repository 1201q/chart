'use client';

import { useTicker } from '@/hooks/useTicker';
import styles from './styles/exchange.header.module.css';
import { createKrwPriceFormatter } from '@/utils/formatting/price';
import { formatChangeRate } from '@/utils/formatting/changeRate';
import { ChevronDown } from 'lucide-react';
import { Activity, useState } from 'react';
import TickerListModal from './coinList/TickerListModal';

const ExchangeHeader = ({ code }: { code: string }) => {
  const ticker = useTicker(code);
  const [listOpen, setListOpen] = useState(false);

  if (!ticker) return <div className={styles.exchangeHeader}></div>;

  const priceFormatter = createKrwPriceFormatter(ticker.tradePrice);
  const change = priceFormatter.formatDiffParts(ticker.signedChangePrice);

  return (
    <div className={styles.exchangeHeader}>
      <button
        className={`${styles.coinNameButton} ${listOpen ? styles.open : ''}`}
        onClick={() => setListOpen((prev) => !prev)}
      >
        <span className={styles.koreanNameText}>{ticker.koreanName}</span>
        <span className={styles.codeText}>{code.replace('KRW-', '')}</span>
        <ChevronDown />
      </button>
      <Activity mode={listOpen ? 'visible' : 'hidden'}>
        <TickerListModal close={() => setListOpen(false)} />
      </Activity>
      <div className={styles.textWrapper}>
        <h2 className={styles.coinPriceText}>
          {priceFormatter.formatPrice(ticker.tradePrice)}원
        </h2>
        <div className={styles.changeWrapper}>
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
