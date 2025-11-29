'use client';

import { useTicker } from '@/hooks/useTicker';
import styles from './styles/market.info.module.css';
import { createKrwPriceFormatter } from '@/utils/formatting/price';
import { formatChangeRate } from '@/utils/formatting/changeRate';

const MainInfo = ({ code }: { code: string }) => {
  const ticker = useTicker(code);

  if (!ticker) return <div className={styles.marketInfo}></div>;

  const priceFormatter = createKrwPriceFormatter(ticker.tradePrice);
  const change = priceFormatter.formatDiffParts(ticker.signedChangePrice);

  return (
    <div className={styles.marketInfo}>
      <div className={styles.leftWrapper}>
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
      <div className={styles.rightWrapper}>
        <div className={styles.rightItem}>
          <p className={styles.rightItemTitleText}>시작</p>
          <p className={styles.rightItemValueText}>
            {priceFormatter.formatPrice(ticker.openingPrice)}
          </p>
        </div>
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

export default MainInfo;
