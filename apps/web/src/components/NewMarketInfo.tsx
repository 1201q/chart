'use client';

import { useMemo } from 'react';
import styles from './styles/market.info.module.css';

import Image from 'next/image';
import { useTickerSelector2 } from '@/hooks/uses/tickers.hooks';
import { createKrwPriceFormatter } from '@/utils/formatting/price';
import { formatChangeRate } from '@/utils/formatting/changeRate';

type MarketInfoProps = { code: string };

// formatter 재생성 줄이기용
function getPriceBucketKey(price: number) {
  if (!Number.isFinite(price)) return 'default';
  if (price >= 100) return 'ge100'; // 100 이상
  if (price >= 10) return '10-100'; // 10 이상 100 미만
  if (price >= 1) return '1-10'; // 1 이상 10 미만
  if (price >= 0.1) return '0.1-1'; // 0.1 이상 1 미만
  return 'lt0.1'; // 0.1 미만
}

// 대표 가격 뱉기
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

const NewMarketInfo = ({ code }: MarketInfoProps) => {
  return (
    <div className={styles.marketInfo}>
      <div className={styles.leftWrapper}>
        <MarketIcon code={code} />
        <MarketLeftInfo code={code} />
      </div>
      <div className={styles.rightWrapper}>
        <MarketRightInfo code={code} />
      </div>
    </div>
  );
};

const MarketIcon = ({ code }: { code: string }) => {
  const imgSrc = `${process.env.NEXT_PUBLIC_API_URL}/markets/icon/${code.replace('KRW-', '').toUpperCase()}`;

  return (
    <div className={styles.leftIconWrapper}>
      <Image src={imgSrc} alt={`${code} icon`} width={35} height={35} unoptimized />
    </div>
  );
};

const MarketLeftInfo = ({ code }: { code: string }) => {
  const tradePrice = useTickerSelector2(code, (s) => s?.tradePrice ?? 0);
  const signedChangePrice = useTickerSelector2(code, (s) => s?.signedChangePrice ?? 0);
  const changeRate = useTickerSelector2(code, (s) => s?.changeRate ?? 0);
  const change = useTickerSelector2(code, (s) => s?.change ?? 0);

  const priceFormatter = useStableKrwFormatter(tradePrice);
  const changeParts = priceFormatter.formatDiffParts(signedChangePrice);

  return (
    <div className={styles.leftInfoWrapper}>
      <div className={styles.leftTopWrapper}>
        <p className={styles.currentPriceText}>
          {priceFormatter.formatPrice(tradePrice)}원
        </p>
      </div>
      <div className={styles.leftBottomWrapper}>
        <p className={styles.changeText}>전일대비</p>
        <p
          className={`${styles.changeNumericText} ${change === 'RISE' ? styles.rise : change === 'FALL' ? styles.fall : styles.even}`}
        >
          {changeParts.sign}
          {changeParts.numeric} ({formatChangeRate(changeRate)}
          %)
        </p>
      </div>
    </div>
  );
};

const MarketRightInfo = ({ code }: { code: string }) => {
  const tradePrice = useTickerSelector2(code, (s) => s?.tradePrice ?? 0);
  const highPrice = useTickerSelector2(code, (s) => s?.highPrice ?? 0);
  const lowPrice = useTickerSelector2(code, (s) => s?.lowPrice ?? 0);
  const highest52WeekDate = useTickerSelector2(code, (s) => s?.highest52WeekDate ?? '-');
  const highest52WeekPrice = useTickerSelector2(code, (s) => s?.highest52WeekPrice ?? 0);
  const lowest52WeekDate = useTickerSelector2(code, (s) => s?.lowest52WeekDate ?? '-');
  const lowest52WeekPrice = useTickerSelector2(code, (s) => s?.lowest52WeekPrice ?? 0);

  const priceFormatter = useStableKrwFormatter(tradePrice);

  return (
    <>
      <div className={styles.rightItem}>
        <p className={styles.rightItemTitleText}>1일 최고</p>
        <p className={styles.rightItemValueText}>
          {priceFormatter.formatPrice(highPrice)}
        </p>
      </div>
      <div className={styles.rightItem}>
        <p className={styles.rightItemTitleText}>1일 최저</p>
        <p className={styles.rightItemValueText}>
          {priceFormatter.formatPrice(lowPrice)}
        </p>
      </div>
      <div className={styles.rightItem}>
        <p className={styles.rightItemTitleText}>
          1년 최고 ({highest52WeekDate.replaceAll('-', '.')})
        </p>
        <p className={styles.rightItemValueText}>
          {priceFormatter.formatPrice(highest52WeekPrice)}
        </p>
      </div>
      <div className={styles.rightItem}>
        <p className={styles.rightItemTitleText}>
          1년 최저 ({lowest52WeekDate.replaceAll('-', '.')})
        </p>
        <p className={styles.rightItemValueText}>
          {priceFormatter.formatPrice(lowest52WeekPrice)}
        </p>
      </div>
    </>
  );
};

export default NewMarketInfo;
