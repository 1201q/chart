import styles from './styles/ticker.item.module.css';

import { createKrwPriceFormatter } from '@/utils/formatting/price';
import { formatChangeRate } from '@/utils/formatting/changeRate';
import { formatAccTradePriceKRW } from '@/utils/formatting/accTradePriceKRW';
import Link from 'next/link';
import Image from 'next/image';
import { useTickerSelector } from '@/hooks/tickers.hooks';
import { useEffect } from 'react';

const NewTickerItem = ({ code }: { code: string }) => {
  const koreanName = useTickerSelector(code, (t) => t?.koreanName ?? code);
  const accTradePrice24h = useTickerSelector(code, (t) => t?.accTradePrice24h ?? 0);
  const tradePrice = useTickerSelector(code, (t) => t?.tradePrice ?? 0);
  const signedChangePrice = useTickerSelector(code, (t) => t?.signedChangePrice ?? 0);
  const changeRaw = useTickerSelector(code, (t) => t?.change ?? 'EVEN');
  const changeRate = useTickerSelector(code, (t) => t?.changeRate ?? 0);

  const { numeric, unit } = formatAccTradePriceKRW(accTradePrice24h);

  const priceFormatter = createKrwPriceFormatter(tradePrice);

  const change = priceFormatter.formatDiffParts(signedChangePrice);
  const price = priceFormatter.formatPrice(tradePrice);

  const imgSrc = `${process.env.NEXT_PUBLIC_API_URL}/markets/icon/${code.replace('KRW-', '').toUpperCase()}`;

  useEffect(() => {
    console.log(koreanName);
  }, [koreanName]);

  return (
    <Link href={`/test/${code}`} prefetch={false}>
      <li className={styles.item}>
        <div className={styles.iconWrap}>
          <Image src={imgSrc} alt={`${code} icon`} width={30} height={30} unoptimized />
        </div>
        <div className={styles.coinNameWrap}>
          <span className={styles.coinName}>{koreanName}</span>
          <span className={styles.coinCode}>
            <span className={styles.accTradePrice}>{numeric}</span>
            <span className={styles.accTradePriceUnit}>{unit}원</span>
          </span>
        </div>

        <div className={styles.priceWrap}>
          <span className={styles.currentPriceText}>{price}원</span>
          <span
            className={`${styles.changeText} ${changeRaw === 'RISE' ? styles.rise : changeRaw === 'FALL' ? styles.fall : styles.even}`}
          >
            {change.sign}
            {change.numeric} ({formatChangeRate(changeRate)}
            %)
          </span>
        </div>
      </li>
    </Link>
  );
};

export default NewTickerItem;
