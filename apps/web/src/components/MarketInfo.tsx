'use client';

import { useTicker, useTickerMeta } from '@/utils/stores/ticker.store';
import styles from './styles/market.info.module.css';
import { createKrwPriceFormatter } from '@/utils/formatting/price';
import { formatChangeRate } from '@/utils/formatting/changeRate';
import Image from 'next/image';

const MainInfo = ({ code }: { code: string }) => {
  const ticker = useTicker(code);
  const meta = useTickerMeta();

  if (!meta.snapshoted || !ticker) return <SkeletonMarketInfo />;
  if (meta.error) return <div className={styles.exchangeHeader}>에러났다</div>;

  const priceFormatter = createKrwPriceFormatter(ticker.tradePrice);
  const change = priceFormatter.formatDiffParts(ticker.signedChangePrice);

  const imgSrc = `${process.env.NEXT_PUBLIC_API_URL}/markets/icon/${code.replace('KRW-', '').toUpperCase()}`;

  return (
    <div className={styles.marketInfo}>
      <div className={styles.leftWrapper}>
        <div className={styles.leftIconWrapper}>
          <Image src={imgSrc} alt={`${code} icon`} width={35} height={35} unoptimized />
        </div>
        <div className={styles.leftInfoWrapper}>
          <div className={styles.leftTopWrapper}>
            <p className={styles.coinNameText}>{ticker.koreanName}</p>
            <p className={styles.currentPriceText}>
              {priceFormatter.formatPrice(ticker.tradePrice)}원
            </p>
          </div>
          <div className={styles.leftBottomWrapper}>
            <p className={styles.changeText}>전일대비</p>
            <p
              className={`${styles.changeNumericText} ${ticker.change === 'RISE' ? styles.rise : ticker.change === 'FALL' ? styles.fall : styles.even}`}
            >
              {change.sign}
              {change.numeric} ({formatChangeRate(ticker.changeRate)}
              %)
            </p>
          </div>
        </div>
      </div>
      <div className={styles.rightWrapper}>
        <div className={styles.rightItem}>
          <p className={styles.rightItemTitleText}>1일 최고</p>
          <p className={styles.rightItemValueText}>
            {priceFormatter.formatPrice(ticker.highPrice)}
          </p>
        </div>
        <div className={styles.rightItem}>
          <p className={styles.rightItemTitleText}>1일 최저</p>
          <p className={styles.rightItemValueText}>
            {priceFormatter.formatPrice(ticker.lowPrice)}
          </p>
        </div>
        <div className={styles.rightItem}>
          <p className={styles.rightItemTitleText}>
            1년 최고 ({ticker.highest52WeekDate.replaceAll('-', '.')})
          </p>
          <p className={styles.rightItemValueText}>
            {priceFormatter.formatPrice(ticker.highest52WeekPrice)}
          </p>
        </div>
        <div className={styles.rightItem}>
          <p className={styles.rightItemTitleText}>
            1년 최저 ({ticker.lowest52WeekDate.replaceAll('-', '.')})
          </p>
          <p className={styles.rightItemValueText}>
            {priceFormatter.formatPrice(ticker.lowest52WeekPrice)}
          </p>
        </div>
      </div>
    </div>
  );
};

const SkeletonMarketInfo = () => {
  return (
    <div className={styles.marketInfo}>
      <div className={styles.leftWrapper}>
        <div className={`${styles.leftIconWrapper} ${styles.skeleton} sk `}>
          {/* <Image src={imgSrc} alt={`${code} icon`} width={35} height={35} unoptimized /> */}
        </div>
        <div className={styles.leftInfoWrapper}>
          <div className={`sk ${styles.leftTopWrapper} ${styles.skeleton}`}></div>
          <div className={`sk ${styles.leftBottomWrapper} ${styles.skeleton}`}></div>
        </div>
      </div>
      <div className={styles.rightWrapper}>
        <div className={styles.rightItem}>
          <div className={`${styles.rightItemTitleText}`}>
            <div className={`sk ${styles.skeleton}`}></div>
          </div>
          <p className={`sk ${styles.skeleton} ${styles.rightItemValueText}`}></p>
        </div>
        <div className={styles.rightItem}>
          <div className={`${styles.rightItemTitleText}`}>
            <div className={`sk ${styles.skeleton}`}></div>
          </div>
          <p className={`sk ${styles.skeleton} ${styles.rightItemValueText}`}></p>
        </div>
        <div className={styles.rightItem}>
          <div className={`${styles.rightItemTitleText}`}>
            <div className={`sk ${styles.skeleton}`}></div>
            <div className={`sk ${styles.skeleton} ${styles.year}`}></div>
          </div>
          <p className={`sk ${styles.skeleton} ${styles.rightItemValueText}`}></p>
        </div>
        <div className={styles.rightItem}>
          <div className={`${styles.rightItemTitleText}`}>
            <div className={`sk ${styles.skeleton}`}></div>
            <div className={`sk ${styles.skeleton} ${styles.year}`}></div>
          </div>
          <p className={`sk ${styles.skeleton} ${styles.rightItemValueText}`}></p>
        </div>
      </div>
    </div>
  );
};

export default MainInfo;
