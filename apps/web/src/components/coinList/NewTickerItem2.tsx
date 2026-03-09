import styles from './styles/ticker.item2.module.css';

import { createKrwPriceFormatter } from '@/utils/formatting/price';
import { formatSignedChangeRate } from '@/utils/formatting/changeRate';
import { formatAccTradePriceKRW } from '@/utils/formatting/accTradePriceKRW';
import Link from 'next/link';
import { MarketTickerWithNames } from '@chart/shared-types';

const NewTickerItem2 = ({ ticker }: { ticker: MarketTickerWithNames }) => {
  const { numeric, unit } = formatAccTradePriceKRW(ticker.accTradePrice24h);

  const priceFormatter = createKrwPriceFormatter(ticker.tradePrice);

  const price = priceFormatter.formatPrice(ticker.tradePrice);

  return (
    <Link href={`/test/market/${ticker.code}`} prefetch={false} className={styles.item}>
      <div className={styles.leftWrapper}>
        {/* <Mini24HCandle
          open={ticker.openingPrice}
          high={ticker.highPrice}
          low={ticker.lowPrice}
          close={ticker.tradePrice}
        /> */}
        <div className={styles.leftTextWrapper}>
          <span className={styles.coinName}>{ticker.koreanName}</span>
          <span className={styles.coinCode}>{ticker.code.replaceAll('KRW-', '')}</span>
        </div>
      </div>

      <div className={styles.rightWrapper}>
        <div className={styles.textWrapper}>
          <span
            className={`${styles.currentPriceText} ${ticker.change === 'RISE' ? styles.rise : ticker.change === 'FALL' ? styles.fall : styles.even}`}
          >
            {price}
          </span>
          <span className={styles.accTradePrice}>
            {numeric}
            {unit}
          </span>
        </div>

        <div
          className={`${styles.priceWrapper} ${ticker.change === 'RISE' ? styles.rise : ticker.change === 'FALL' ? styles.fall : styles.even}`}
        >
          <span>{formatSignedChangeRate(ticker.signedChangeRate)}%</span>
        </div>
      </div>
    </Link>
  );
};

export default NewTickerItem2;
