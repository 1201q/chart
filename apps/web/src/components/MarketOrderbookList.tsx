'use client';

import { useTicker } from '@/hooks/useTicker';
import styles from './styles/market.orderbook.module.css';
import { createKrwPriceFormatter } from '@/utils/formatting/price';
import { formatSignedChangeRate } from '@/utils/formatting/changeRate';
import { MarketOrderbook } from '@chart/shared-types';
import { OrderbookRow, useOrderbookSseStream } from '@/hooks/useOrderbookSseStream';

type RowProps = {
  row: OrderbookRow;
  index: number;
  totalRows: number;
  closePrice: number;
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

  return (
    <div className={styles.col2}>
      {rows.map((r, index) => (
        <MarketOrderbookCol2Row
          key={r.price}
          row={r}
          index={index}
          totalRows={rows.length}
          closePrice={ticker.prevClosingPrice}
        />
      ))}
    </div>
  );
};

const MarketOrderbookCol2Row = ({ row, index, totalRows, closePrice }: RowProps) => {
  const half = totalRows / 2;
  const blueCell = index < half;

  const rowClass = `${blueCell ? styles.blueRow : styles.redRow}`;

  const formatter = createKrwPriceFormatter(row.price);

  const textClass =
    row.price - closePrice > 0
      ? styles.rise
      : row.price - closePrice < 0
        ? styles.fall
        : styles.even;

  return (
    <div className={`${styles.row} ${rowClass}`}>
      <div className={styles.cell}>
        <div className={`${styles.priceWrapper} ${textClass}`}>
          <p>{formatter.formatPrice(row.price)}</p>
          <span>{formatSignedChangeRate((row.price - closePrice) / closePrice)}%</span>
        </div>
      </div>
      <div className={styles.cell}>
        <div
          className={styles.bar}
          style={{ transform: `translateX(${100 - row.width}%)` }}
        ></div>
        <div className={styles.sizeText}>
          {row.size.toLocaleString('ko-KR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 3,
          })}
        </div>
      </div>
    </div>
  );
};

export default MarketOrderbookList;
