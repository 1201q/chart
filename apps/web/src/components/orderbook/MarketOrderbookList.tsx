'use client';

import { useTicker } from '@/hooks/useTicker';
import styles from './styles/market.orderbook.module.css';
import { createKrwPriceFormatter } from '@/utils/formatting/price';
import { formatSignedChangeRate } from '@/utils/formatting/changeRate';
import { MarketOrderbook } from '@chart/shared-types';
import { OrderbookRow, useOrderbookSseStream } from '@/hooks/useOrderbookSseStream';
import MarketOrderbookTradeList from './MarketOrderbookTradeList';
import { createKrwVolumeFormatter } from '@/utils/formatting/volume';
import MarketOrderbookSideInfo from './MarketOrderbookSideInfo';

type RowProps = {
  row: OrderbookRow;

  type?: 'blue' | 'red';
  closePrice: number;
  isCurrentPrice?: boolean;
};

const MarketOrderbookList = ({
  initialSnapshot,
  code,
}: {
  initialSnapshot: MarketOrderbook;
  code: string;
}) => {
  const { rows } = useOrderbookSseStream(code, initialSnapshot);

  const ticker = useTicker(code);

  if (!ticker) return null;

  const half = Math.ceil(rows.length / 2);

  const topRows = rows.slice(half / 2, half);
  const bottomRows = rows.slice(half, half + half / 2);

  return (
    <div className={styles.orderbook}>
      <div className={styles.topArea}>
        <div className={styles.topRows}>
          {topRows.map((r) => (
            <MarketOrderbookRow
              key={r.price}
              row={r}
              type={'blue'}
              closePrice={ticker.prevClosingPrice}
              isCurrentPrice={r.price === ticker.tradePrice}
            />
          ))}
        </div>
        <div className={styles.info}>
          <MarketOrderbookSideInfo code={code} />
        </div>
      </div>
      <div className={styles.divider}></div>
      <div className={styles.bottomArea}>
        <div className={styles.info}>
          <MarketOrderbookTradeList code={code} />
        </div>
        <div className={styles.bottomRows}>
          {bottomRows.map((r) => (
            <MarketOrderbookRow
              key={r.price}
              row={r}
              type={'red'}
              closePrice={ticker.prevClosingPrice}
              isCurrentPrice={r.price === ticker.tradePrice}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const MarketOrderbookRow = ({ row, type, closePrice, isCurrentPrice }: RowProps) => {
  const formatter = createKrwPriceFormatter(row.price);
  const volumeFormatter = createKrwVolumeFormatter(row.price);

  const textClass =
    row.price - closePrice > 0
      ? styles.rise
      : row.price - closePrice < 0
        ? styles.fall
        : styles.even;

  return (
    <div className={`${type === 'blue' ? styles.topRow : styles.bottomRow}`}>
      <div className={styles.center}>
        <button
          className={`${styles.centerButton} ${isCurrentPrice ? styles.isCurrent : ''}`}
        >
          <p className={textClass}>{formatter.formatPrice(row.price)}</p>
          <span>{formatSignedChangeRate((row.price - closePrice) / closePrice)}%</span>
        </button>
      </div>
      <div className={styles.side}>
        <p>{volumeFormatter.formatVolume(row.size)}</p>
        <div className={styles.barWrapper}>
          <div
            className={styles.bar}
            style={
              type === 'red'
                ? { transform: `translateX(${row.width}%)` }
                : { transform: `translateX(-${row.width}%)` }
            }
          ></div>
        </div>
      </div>
    </div>
  );
};

export default MarketOrderbookList;
