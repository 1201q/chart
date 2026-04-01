import styles from '@/components/orderbook/styles/market.orderbook.module.css';
import { createKrwPriceFormatter } from '@/utils/formatting/price';
import { createKrwVolumeFormatter } from '@/utils/formatting/volume';
import { formatSignedChangeRate } from '@/utils/formatting/changeRate';

type Props = {
  price: number;
  size: number;
  width: number;
  closePrice: number;
  type: 'blue' | 'red';
};

export function OrderbookRowContent({ price, size, width, closePrice, type }: Props) {
  const formatter = createKrwPriceFormatter(price);
  const volumeFormatter = createKrwVolumeFormatter(price);

  const textClass =
    price - closePrice > 0
      ? styles.rise
      : price - closePrice < 0
        ? styles.fall
        : styles.even;

  return (
    <div className={type === 'blue' ? styles.topRow : styles.bottomRow}>
      <div className={styles.center}>
        <button className={styles.centerButton}>
          <p className={textClass}>{formatter.formatPrice(price)}</p>
          <span>{formatSignedChangeRate((price - closePrice) / closePrice)}%</span>
        </button>
      </div>
      <div className={styles.side}>
        <p>{volumeFormatter.formatVolume(size)}</p>
        <div className={styles.barWrapper}>
          <div
            className={styles.bar}
            style={
              type === 'red'
                ? { transform: `translateX(${width}%)` }
                : { transform: `translateX(-${width}%)` }
            }
          />
        </div>
      </div>
    </div>
  );
}
