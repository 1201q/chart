'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { MarketOrderbook } from '@chart/shared-types';
import { OrderbookRowStore } from '@/utils/stores/new/OrderbookRowStore';
import { OrderbookRowContent } from './OrderbookRowContent';
import styles from '@/components/orderbook/styles/market.orderbook.module.css';

type Props = {
  sseUrl: string;
  initialSnapshot: MarketOrderbook;
  closePrice: number;
};

type RowProps = {
  index: number;
  store: OrderbookRowStore;
  closePrice: number;
  type: 'blue' | 'red';
};

const TOP_INDICES = Array.from({ length: 30 }, (_, i) => i);
const BOTTOM_INDICES = Array.from({ length: 30 }, (_, i) => i + 30);

export function CurrentOrderbook({ sseUrl, initialSnapshot, closePrice }: Props) {
  const [store] = useState(() => new OrderbookRowStore(initialSnapshot, 60));

  useEffect(() => {
    const es = new EventSource(sseUrl);

    es.addEventListener('realtime', (event) => {
      const data = JSON.parse(event.data) as MarketOrderbook;
      store.updateFromStream(data);
    });

    return () => es.close();
  }, [sseUrl, store]);

  return (
    <div className={styles.orderbook}>
      <div className={styles.topArea}>
        <div className={styles.topRows}>
          {TOP_INDICES.map((i) => (
            <CurrentRow key={i} index={i} store={store} closePrice={closePrice} type="blue" />
          ))}
        </div>
        <div className={styles.info} />
      </div>
      <div className={styles.divider} />
      <div className={styles.bottomArea}>
        <div className={styles.info} />
        <div className={styles.bottomRows}>
          {BOTTOM_INDICES.map((i) => (
            <CurrentRow key={i} index={i} store={store} closePrice={closePrice} type="red" />
          ))}
        </div>
      </div>
    </div>
  );
}

function CurrentRow({ index, store, closePrice, type }: RowProps) {
  const row = useSyncExternalStore(
    (l) => store.subscribeKey(index, l),
    () => store.getRow(index),
    () => store.getRow(index),
  );

  return (
    <OrderbookRowContent
      price={row.price}
      size={row.size}
      width={row.width}
      closePrice={closePrice}
      type={type}
    />
  );
}
