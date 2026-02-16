'use client';

import { useTicker, useTickerStore } from '@/hooks/uses/tickers.hooks';
import { createKrwPriceFormatter } from '@/utils/formatting/price';
import { formatChangeRate } from '@/utils/formatting/changeRate';
import { formatAccTradePriceKRW } from '@/utils/formatting/accTradePriceKRW';
import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import styles from './MainPageCoinRow.module.css';

interface MainPageCoinRowProps {
  code: string;
}

const MainPageCoinRow = ({ code }: MainPageCoinRowProps) => {
  const ticker = useTicker(code);
  const store = useTickerStore();

  if (!ticker) return null;

  const priceFormatter = createKrwPriceFormatter(ticker.tradePrice);
  const price = priceFormatter.formatPrice(ticker.tradePrice);
  const change = priceFormatter.formatDiffParts(ticker.signedChangePrice);
  const { numeric: accNumeric, unit: accUnit } = formatAccTradePriceKRW(
    ticker.accTradePrice24h,
  );

  const imgSrc = `${'https://api.chartraders.club'}/markets/icon/${ticker.code.replace('KRW-', '').toUpperCase()}`;

  // 고가/저가 포맷팅
  const highPrice = priceFormatter.formatPrice(ticker.highPrice);
  const lowPrice = priceFormatter.formatPrice(ticker.lowPrice);

  const isWatchlisted = store.hasWatchlist(code);

  const handleToggleWatchlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    store.toggleWatchlist(code);
  };

  return (
    <Link href={`/market/${code}`} prefetch={false} className={styles.row}>
      {/* 이름/코드 (별 포함) */}
      <div className={styles.nameCell}>
        <button
          className={styles.starButton}
          onClick={handleToggleWatchlist}
          type="button"
          aria-label="Toggle watchlist"
        >
          <Star
            size={18}
            fill={isWatchlisted ? 'var(--yellow)' : 'none'}
            stroke={isWatchlisted ? 'var(--yellow)' : 'var(--grey500)'}
            strokeWidth={1.5}
          />
        </button>
        <div className={styles.iconWrap}>
          <Image src={imgSrc} alt={`${ticker.code} icon`} width={24} height={24} />
        </div>
        <div className={styles.nameWrap}>
          <span className={styles.koreanName}>{ticker.koreanName}</span>
          <span className={styles.code}>{ticker.code.replace('KRW-', '')}</span>
        </div>
      </div>

      {/* 현재가 */}
      <div className={styles.priceCell}>
        <span className={styles.price}>{price}원</span>
      </div>

      {/* 24h 변동 */}
      <div className={styles.changeCell}>
        <span
          className={`${styles.changeRate} ${
            ticker.change === 'RISE'
              ? styles.rise
              : ticker.change === 'FALL'
                ? styles.fall
                : styles.even
          }`}
        >
          {change.sign}
          {formatChangeRate(ticker.changeRate)}%
        </span>
      </div>

      {/* 24h 거래대금 */}
      <div className={styles.volumeCell}>
        <span className={styles.volumeNumeric}>{accNumeric}</span>
        <span className={styles.volumeUnit}>{accUnit}원</span>
      </div>

      {/* 24h 고가/저가 */}
      <div className={styles.highLowCell}>
        <div className={styles.rangeContainer}>
          <div className={styles.rangeBar}>
            <div
              className={styles.rangeMarker}
              style={{
                left: `${((ticker.tradePrice - ticker.lowPrice) / (ticker.highPrice - ticker.lowPrice)) * 100}%`,
              }}
            >
              <div className={styles.triangle}></div>
            </div>
          </div>
          <div className={styles.rangePrices}>
            <span className={styles.lowPrice}>{lowPrice}</span>
            <span className={styles.highPrice}>{highPrice}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MainPageCoinRow;
