'use client';
import styles from './styles/order.form.history.module.css';

import PendingOrderItem from './PendingOrderItem';
import { usePendingOrders } from '@/hooks/uses/trading.hooks';

function dateKey(ts: Date | string) {
  const d = typeof ts === 'string' ? new Date(ts) : ts;

  return d.toISOString().split('T')[0];
}

const PendingOrderList = () => {
  const orders = usePendingOrders();

  // showDate 포함
  const items = orders.map((o, idx) => {
    const currentKey = dateKey(o.createdAt);

    const prev = orders[idx - 1];
    const prevKey = prev ? dateKey(prev.createdAt) : null;

    const showDate = idx === 0 || currentKey !== prevKey;

    return { order: o, showDate };
  });

  return (
    <>
      <div className={styles.listViewport}>
        <div className={styles.completedList}>
          {items.map((data) => (
            <PendingOrderItem
              key={data.order.id}
              data={data.order}
              showDate={data.showDate}
            />
          ))}
        </div>
        {orders.length === 0 && (
          <div className={styles.emptyList}>
            <span>주문 내역이 없습니다.</span>
          </div>
        )}
      </div>
    </>
  );
};

export default PendingOrderList;
