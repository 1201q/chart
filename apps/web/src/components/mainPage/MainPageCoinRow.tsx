'use client';

import { useTicker, useTickerStore } from '@/hooks/uses/tickers.hooks';
import { createKrwPriceFormatter } from '@/utils/formatting/price';
import { formatChangeRate } from '@/utils/formatting/changeRate';
import { formatAccTradePriceKRW } from '@/utils/formatting/accTradePriceKRW';
import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated } from '@/utils/context/auth.context';
import { toggleFavorite } from '@/utils/api/favorites.api';
import styles from './MainPageCoinRow.module.css';

interface MainPageCoinRowProps {
  code: string;
}

const MainPageCoinRow = ({ code }: MainPageCoinRowProps) => {
  const ticker = useTicker(code);
  const store = useTickerStore();
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();

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

  const priceRange = ticker.highPrice - ticker.lowPrice;
  const markerLeft =
    priceRange <= 0 ? 0 : ((ticker.tradePrice - ticker.lowPrice) / priceRange) * 100;

  const handleToggleWatchlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // 낙관적 업데이트
    store.toggleWatchlist(code);

    // API 호출, 실패 시 롤백
    toggleFavorite(code).catch(() => {
      store.toggleWatchlist(code);
    });
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

      {/* 현재가 + 변동률 (모바일 < 450px: 세로 묶음, 그 이상: grid contents) */}
      <div className={styles.rightGroup}>
        {/* 현재가 */}
        <div className={styles.priceCell}>
          <span className={styles.price}>{price}</span>
          <span className={styles.price}>원</span>
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
                left: `${Math.max(0, Math.min(100, markerLeft))}%`,
              }}
            >
              <div className={styles.triangle}></div>
            </div>
          </div>
          <div className={styles.rangePrices}>
            <div className={styles.rangePriceRow}>
              <span className={styles.rangeLabel}>저</span>
              <span className={styles.lowPrice}>{lowPrice}</span>
            </div>
            <div className={styles.rangePriceRow}>
              <span className={styles.rangeLabel}>고</span>
              <span className={styles.highPrice}>{highPrice}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MainPageCoinRow;
