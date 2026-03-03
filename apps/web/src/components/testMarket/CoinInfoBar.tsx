'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { ChevronDown, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTickerSelector2, useTickerStore } from '@/hooks/uses/tickers.hooks';
import { toggleFavorite } from '@/utils/api/favorites.api';
import { createKrwPriceFormatter } from '@/utils/formatting/price';
import { createKrwVolumeFormatter } from '@/utils/formatting/volume';
import { formatAccTradePriceKRW } from '@/utils/formatting/accTradePriceKRW';
import { formatChangeRate } from '@/utils/formatting/changeRate';
import { AuthUser } from '@/utils/api/auth.api';
import styles from './styles/CoinInfoBar.module.css';

interface CoinInfoBarProps {
  code: string;
  user: AuthUser | null;
  initialIsFavorite: boolean;
  coinListOpen: boolean;
  onCoinListOpen: () => void;
}

function getPriceBucketKey(price: number) {
  if (!Number.isFinite(price)) return 'default';
  if (price >= 100) return 'ge100';
  if (price >= 10) return '10-100';
  if (price >= 1) return '1-10';
  if (price >= 0.1) return '0.1-1';
  return 'lt0.1';
}

function getPriceForBucketKey(key: string) {
  switch (key) {
    case 'ge100':
      return 100;
    case '10-100':
      return 10;
    case '1-10':
      return 1;
    case '0.1-1':
      return 0.1;
    case 'lt0.1':
      return 0.01;
    default:
      return 1;
  }
}

function useStableKrwFormatter(price: number) {
  const key = getPriceBucketKey(price);
  const represent = useMemo(() => getPriceForBucketKey(key), [key]);
  return useMemo(() => createKrwPriceFormatter(represent), [represent]);
}

const CoinInfoBar = ({
  code,
  user,
  initialIsFavorite,
  coinListOpen,
  onCoinListOpen,
}: CoinInfoBarProps) => {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const tickerStore = useTickerStore();
  const router = useRouter();

  const tradePrice = useTickerSelector2(code, (s) => s?.tradePrice ?? 0);
  const signedChangePrice = useTickerSelector2(code, (s) => s?.signedChangePrice ?? 0);
  const changeRate = useTickerSelector2(code, (s) => s?.changeRate ?? 0);
  const change = useTickerSelector2(code, (s) => s?.change ?? 'EVEN');
  const highPrice = useTickerSelector2(code, (s) => s?.highPrice ?? 0);
  const lowPrice = useTickerSelector2(code, (s) => s?.lowPrice ?? 0);
  const prevClosingPrice = useTickerSelector2(code, (s) => s?.prevClosingPrice ?? 0);
  const accTradeVolume24h = useTickerSelector2(code, (s) => s?.accTradeVolume24h ?? 0);
  const accTradePrice24h = useTickerSelector2(code, (s) => s?.accTradePrice24h ?? 0);
  const koreanName = useTickerSelector2(code, (s) => s?.koreanName ?? '');

  const priceFormatter = useStableKrwFormatter(tradePrice);
  const priceBucketKey = getPriceBucketKey(tradePrice);
  const volumeFormatter = useMemo(
    () => createKrwVolumeFormatter(getPriceForBucketKey(priceBucketKey)),
    [priceBucketKey],
  );

  const changeParts = priceFormatter.formatDiffParts(signedChangePrice);
  const accTradeAmountFmt = formatAccTradePriceKRW(accTradePrice24h);
  const dataPositive = change === 'RISE' ? 'true' : change === 'FALL' ? 'false' : 'even';
  const assetSymbol = code.replace('KRW-', '');
  const iconSrc = `https://api.chartraders.club/markets/icon/${assetSymbol.toUpperCase()}`;

  const handleFavoriteClick = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    const prev = isFavorite;
    setIsFavorite(!prev);
    tickerStore.toggleWatchlist(code);
    toggleFavorite(code).catch(() => {
      setIsFavorite(prev);
      tickerStore.toggleWatchlist(code);
    });
  };

  return (
    <>
      {/* 코인 선택 영역 */}
      <div className={styles.coinSelectorArea}>
        <button className={styles.coinSelector} onClick={onCoinListOpen}>
          <div className={styles.coinNameRow}>
            <div className={styles.coinIcon}>
              <Image src={iconSrc} alt={assetSymbol} width={22} height={22} />
            </div>
            <span className={styles.coinSymbol}>{koreanName}</span>
            <span className={styles.selectorChevron} data-open={coinListOpen}>
              <ChevronDown size={14} />
            </span>
          </div>
        </button>
        <span className={styles.mobilePriceMain} data-positive={dataPositive}>
          {priceFormatter.formatPrice(tradePrice)}
        </span>
        <span className={styles.mobilePriceSub} data-positive={dataPositive}>
          {changeParts.sign}
          {changeParts.numeric} ({formatChangeRate(changeRate)}%)
        </span>
      </div>

      {/* 구분선 */}
      <div className={styles.barDivider} />

      {/* 스크롤 가능한 가격·통계 영역 */}
      <div className={styles.infoScrollArea}>
        <div className={styles.priceBlock}>
          <span className={styles.priceMain} data-positive={dataPositive}>
            {priceFormatter.formatPrice(tradePrice)}
          </span>
          <span className={styles.priceSub} data-positive={dataPositive}>
            {changeParts.sign}
            {changeParts.numeric} ({formatChangeRate(changeRate)}%)
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>전일종가</span>
          <span className={styles.statValue}>{priceFormatter.formatPrice(prevClosingPrice)}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>고가</span>
          <span className={styles.statValue}>{priceFormatter.formatPrice(highPrice)}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>저가</span>
          <span className={styles.statValue}>{priceFormatter.formatPrice(lowPrice)}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>24h 거래량</span>
          <span className={styles.statValue}>
            {volumeFormatter.formatVolume(accTradeVolume24h)} {assetSymbol}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>24h 거래대금</span>
          <span className={styles.statValue}>
            {accTradeAmountFmt.numeric}
            {accTradeAmountFmt.unit}
          </span>
        </div>
      </div>

      {/* 즐겨찾기 */}
      <button
        className={styles.favoriteBtn}
        onClick={handleFavoriteClick}
        aria-label="즐겨찾기"
        data-active={isFavorite}
      >
        <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>
    </>
  );
};

export default CoinInfoBar;
