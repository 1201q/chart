'use client';

import { useTicker } from '@/hooks/useTicker';
import styles from './styles/market.orderbook.module.css';
import { createKrwPriceFormatter } from '@/utils/formatting/price';
import { formatChangeRate, formatSignedChangeRate } from '@/utils/formatting/changeRate';
import { MarketOrderbook } from '@chart/shared-types';
import { OrderbookRow, useOrderbookSseStream } from '@/hooks/useOrderbookSseStream';
import React from 'react';

type RowProps = {
  row: OrderbookRow;
  index: number;
  totalRows: number;
};

const MarketOrderbookList = ({
  initialSnapshot,
  code,
}: {
  initialSnapshot: MarketOrderbook;
  code: string;
}) => {
  const { rows } = useOrderbookSseStream(code, initialSnapshot);

  // const formatter = createKrwPriceFormatter(rows);

  // const ticker = useTicker(code);

  // if (!ticker) return null;

  return (
    <div className={styles.orderbook}>
      {rows.map((row, index) => (
        <MarketOrderbookItem
          key={row.price}
          row={row}
          index={index}
          totalRows={rows.length}
        />
      ))}
    </div>
  );
};

const MarketOrderbookItem = React.memo<RowProps>(({ row, index, totalRows }) => {
  const half = totalRows / 2;
  const isAskRow = index < half;
  const isBidRow = index >= half;

  const formatter = createKrwPriceFormatter(row.price);

  const rowClass = isAskRow
    ? styles.askOnlyRow
    : isBidRow
      ? styles.bidOnlyRow
      : styles.bothRow;

  return (
    <div className={`${styles.row} ${rowClass}`}>
      <div className={`${styles.askCell} ${styles.askArea}`}>
        {isAskRow && row.askSize > 0 && (
          <>
            <div className={styles.askBar} style={{ width: `${row.askWidth}%` }}></div>
            <span className={styles.sizeText}>
              {row.askSize.toLocaleString('ko-KR', {
                minimumFractionDigits: 2,
              })}
            </span>
          </>
        )}
      </div>
      <div className={styles.priceArea}>
        {row.price > 0 && <span>{formatter.formatPrice(row.price)}</span>}
      </div>
      <div className={`${styles.bidCell} ${styles.bidArea}`}>
        {isBidRow && row.bidSize > 0 && (
          <>
            <div className={styles.bidBar} style={{ width: `${row.bidWidth}%` }} />
            <span className={styles.sizeText}>{row.bidSize.toFixed(4)}</span>
          </>
        )}
      </div>
    </div>
  );
});

MarketOrderbookItem.displayName = 'MarketOrderbookItem';

export default MarketOrderbookList;
