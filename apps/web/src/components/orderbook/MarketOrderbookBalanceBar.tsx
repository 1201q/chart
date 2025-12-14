'use client';

import { OrderbookBalance } from '@/hooks/useOrderbookSseStream';
import styles from './styles/market.orderbook.balancebar.module.css';
import { createKrwVolumeFormatter } from '@/utils/formatting/volume';

import { ArrowRight } from 'lucide-react';

interface MarketOrderbookBalanceBarProps {
  balance: OrderbookBalance;
  highPrice: number; // volume 기준
}

const MarketOrderbookBalanceBar = ({
  balance,
  highPrice,
}: MarketOrderbookBalanceBarProps) => {
  const volumeFormatter = createKrwVolumeFormatter(highPrice);

  return (
    <div className={styles.balancebar}>
      <div className={styles.track}>
        <span
          className={`${styles.bar} ${styles.blue}`}
          style={{ transform: `translateX(${balance.askRatio}%)` }}
        ></span>
        <span
          className={`${styles.bar} ${styles.red}`}
          style={{ transform: `translateX(-${balance.bidRatio}%)` }}
        ></span>

        <div className={`${styles.icon} ${styles.red}`}>
          <ArrowRight size={13} strokeWidth={2.5} style={{ transform: `scale(-1,-1)` }} />
        </div>
        <p className={`${styles.size} ${styles.red}`}>
          {volumeFormatter.formatVolume(balance.bidTotal)}
        </p>
        <div className={`${styles.icon} ${styles.blue}`}>
          <ArrowRight size={13} strokeWidth={2.5} />
        </div>
        <p className={`${styles.size} ${styles.blue}`}>
          {volumeFormatter.formatVolume(balance.askTotal)}
        </p>
      </div>
    </div>
  );
};

export default MarketOrderbookBalanceBar;
