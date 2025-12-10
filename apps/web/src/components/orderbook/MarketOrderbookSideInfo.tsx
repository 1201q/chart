'use client';

import styles from './styles/market.orderbook.sideinfo.module.css';
import { createKrwPriceFormatter } from '@/utils/formatting/price';

import { UpbitAskBid } from '@chart/shared-types';

import { useTicker } from '@/hooks/useTicker';
import { formatAccTradePriceKRW } from '@/utils/formatting/accTradePriceKRW';

interface RowProps {
  tradePrice: number;
  tradeVolume: number;
  askBid: UpbitAskBid;
}

const MarketOrderbookSideInfo = ({ code }: { code: string }) => {
  const ticker = useTicker(code);

  if (!ticker) return null;

  const { numeric, unit } = formatAccTradePriceKRW(ticker.accTradePrice24h);

  const priceFormatter = createKrwPriceFormatter(ticker.tradePrice);

  return (
    <div className={styles.sideInfo}>
      <ul className={styles.sideInfoItemList}>
        <li className={styles.sideInfoItem}>
          <span className={styles.sideInfoItemTitle}>거래량</span>
          <div className={`${styles.sideInfoItemValue}`}>
            <span className={styles.text}>
              {ticker.accTradeVolume24h.toLocaleString('ko-KR', {
                maximumFractionDigits: 0,
              })}
            </span>
            <span className={styles.unit}>{code.replaceAll('KRW-', '')}</span>
          </div>
        </li>
        <li className={styles.sideInfoItem}>
          <span className={styles.sideInfoItemTitle}>거래대금</span>
          <div className={`${styles.sideInfoItemValue}`}>
            <span className={styles.text}>{numeric}</span>
            <span className={styles.unit}>{unit}</span>
          </div>
        </li>
        <div className={styles.divider}></div>
        <li className={styles.sideInfoItem}>
          <span className={styles.sideInfoItemTitle}>1년 최고</span>
          <div className={`${styles.sideInfoItemValue}  ${styles.column}`}>
            <span className={`${styles.text} ${styles.rise400}`}>
              {priceFormatter.formatPrice(ticker.highest52WeekPrice)}
            </span>
            <span className={styles.unit}>
              ({ticker.highest52WeekDate.replaceAll('-', '.')})
            </span>
          </div>
        </li>
        <li className={styles.sideInfoItem}>
          <span className={styles.sideInfoItemTitle}>1년 최저</span>
          <div className={`${styles.sideInfoItemValue} ${styles.column}`}>
            <span className={`${styles.text} ${styles.fall400}`}>
              {priceFormatter.formatPrice(ticker.lowest52WeekPrice)}
            </span>
            <span className={styles.unit}>
              ({ticker.lowest52WeekDate.replaceAll('-', '.')})
            </span>
          </div>
        </li>
        <div className={styles.divider}></div>
        <li className={styles.sideInfoItem}>
          <span className={styles.sideInfoItemTitle}>시작</span>
          <div className={`${styles.sideInfoItemValue}`}>
            <span className={styles.text}>
              {priceFormatter.formatPrice(ticker.openingPrice)}
            </span>
          </div>
        </li>
        <li className={styles.sideInfoItem}>
          <span className={styles.sideInfoItemTitle}>고가</span>
          <div className={`${styles.sideInfoItemValue}`}>
            <span className={`${styles.text} ${styles.rise500}`}>
              {priceFormatter.formatPrice(ticker.highPrice)}
            </span>
          </div>
        </li>
        <li className={styles.sideInfoItem}>
          <span className={styles.sideInfoItemTitle}>저가</span>
          <div className={`${styles.sideInfoItemValue}`}>
            <span className={`${styles.text} ${styles.fall500}`}>
              {priceFormatter.formatPrice(ticker.lowPrice)}
            </span>
          </div>
        </li>
      </ul>
    </div>
  );
};

export default MarketOrderbookSideInfo;
