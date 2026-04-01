'use client';

import { memo, useEffect, useState } from 'react';
import { MarketOrderbook } from '@chart/shared-types';
import { buildRows } from '@/utils/stores/new/OrderbookRowStore';
import { OrderbookRowContent } from './OrderbookRowContent';
import styles from '@/components/orderbook/styles/market.orderbook.module.css';

type Props = {
  sseUrl: string;
  initialSnapshot: MarketOrderbook;
  closePrice: number;
};

type RowProps = {
  index: number;
  price: number;
  size: number;
  width: number;
  closePrice: number;
  type: 'blue' | 'red';
};

const TOP_INDICES = Array.from({ length: 30 }, (_, i) => i);
const BOTTOM_INDICES = Array.from({ length: 30 }, (_, i) => i + 30);

export function MemoOrderbook({ sseUrl, initialSnapshot, closePrice }: Props) {
  const [orderbook, setOrderbook] = useState<MarketOrderbook>(initialSnapshot);

  useEffect(() => {
    const es = new EventSource(sseUrl);

    es.addEventListener('realtime', (event) => {
      const data = JSON.parse(event.data) as MarketOrderbook;
      setOrderbook(data);
    });

    return () => es.close();
  }, [sseUrl]);

  const rows = buildRows(orderbook.units, 60);

  return (
    <div className={styles.orderbook}>
      <div className={styles.topArea}>
        <div className={styles.topRows}>
          {TOP_INDICES.map((i) => (
            <MemoRow
              key={i}
              index={i}
              price={rows[i].price}
              size={rows[i].size}
              width={rows[i].width}
              closePrice={closePrice}
              type="blue"
            />
          ))}
        </div>
        <div className={styles.info} />
      </div>
      <div className={styles.divider} />
      <div className={styles.bottomArea}>
        <div className={styles.info} />
        <div className={styles.bottomRows}>
          {BOTTOM_INDICES.map((i) => (
            <MemoRow
              key={i}
              index={i}
              price={rows[i].price}
              size={rows[i].size}
              width={rows[i].width}
              closePrice={closePrice}
              type="red"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const MemoRow = memo(function MemoRow({
  index: _index,
  price,
  size,
  width,
  closePrice,
  type,
}: RowProps) {
  return (
    <OrderbookRowContent
      price={price}
      size={size}
      width={width}
      closePrice={closePrice}
      type={type}
    />
  );
});
