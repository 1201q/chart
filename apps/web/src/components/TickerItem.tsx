import { MarketTickerWithNames } from '@chart/shared-types';
import styles from './styles/ticker.item.module.css';

import { createKrwPriceFormatter, formatKrwPrice } from '@/utils/formatting/price';
import { formatChangeRate } from '@/utils/formatting/changeRate';
import { formatAccTradePriceKRW } from '@/utils/formatting/accTradePriceKRW';

const TickerItem = ({ ticker }: { ticker: MarketTickerWithNames }) => {
  const { numeric, unit } = formatAccTradePriceKRW(ticker.accTradePrice24h);

  const priceFormatter = createKrwPriceFormatter(ticker.tradePrice);

  const change = priceFormatter.formatDiffParts(ticker.signedChangePrice);
  const price = priceFormatter.formatPrice(ticker.tradePrice);

  return (
    <li className={styles.item}>
      <div className={styles.iconWrap}></div>
      <div className={styles.coinNameWrap}>
        <span className={styles.coinName}>{ticker.koreanName}</span>
        <span>
          <span className={styles.accTradePrice}>{numeric}</span>
          <span className={styles.accTradePriceUnit}>{unit}원</span>
        </span>
      </div>

      <div className={styles.priceWrap}>
        <span className={styles.currentPriceText}>{price}원</span>
        <span
          className={`${styles.changeText} ${ticker.change === 'RISE' ? styles.rise : ticker.change === 'FALL' ? styles.fall : styles.even}`}
        >
          {change.numeric} ({formatChangeRate(ticker.changeRate)}
          %)
        </span>
      </div>
    </li>
  );
};

export default TickerItem;
