import { MarketTickerWithNames } from '@chart/shared-types';
import styles from './styles/ticker.item.module.css';

import { createKrwPriceFormatter } from '@/utils/formatting/price';
import { formatChangeRate } from '@/utils/formatting/changeRate';
import { formatAccTradePriceKRW } from '@/utils/formatting/accTradePriceKRW';
import Link from 'next/link';
import Image from 'next/image';

const TickerItem = ({ ticker }: { ticker: MarketTickerWithNames }) => {
  const { numeric, unit } = formatAccTradePriceKRW(ticker.accTradePrice24h);

  const priceFormatter = createKrwPriceFormatter(ticker.tradePrice);

  const change = priceFormatter.formatDiffParts(ticker.signedChangePrice);
  const price = priceFormatter.formatPrice(ticker.tradePrice);

  const imgSrc = `${process.env.NEXT_PUBLIC_API_URL}/markets/icon/${ticker.code.replace('KRW-', '').toUpperCase()}`;

  return (
    <Link href={`/market/${ticker.code}`}>
      <li className={styles.item}>
        <div className={styles.iconWrap}>
          <Image src={imgSrc} alt={`${ticker.code} icon`} width={64} height={64} />
        </div>
        <div className={styles.coinNameWrap}>
          <span className={styles.coinName}>{ticker.koreanName}</span>
          <span className={styles.coinCode}>
            <span className={styles.accTradePrice}>{numeric}</span>
            <span className={styles.accTradePriceUnit}>{unit}원</span>
          </span>
        </div>

        <div className={styles.priceWrap}>
          <span className={styles.currentPriceText}>{price}원</span>
          <span
            className={`${styles.changeText} ${ticker.change === 'RISE' ? styles.rise : ticker.change === 'FALL' ? styles.fall : styles.even}`}
          >
            {change.sign}
            {change.numeric} ({formatChangeRate(ticker.changeRate)}
            %)
          </span>
        </div>
      </li>{' '}
    </Link>
  );
};

export default TickerItem;
