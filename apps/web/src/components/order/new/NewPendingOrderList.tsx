'use client';
import styles from '../styles/order.form.history.module.css';

import PendingOrderItem from './NewPendingOrderItem';
import { usePendingOrders } from '@/hooks/uses/trading.hooks';

const PendingOrderList = ({ code }: { code: string }) => {
  const orders = usePendingOrders();

  return (
    <>
      <div className={styles.listViewport}>
        <div className={styles.completedList}>
          {orders.map((o) => (
            <PendingOrderItem key={o.id} data={o} />
          ))}
        </div>
        {/* {list.length === 0 && (
          <div className={styles.emptyList}>
            <span>주문 내역이 없습니다.</span>
          </div>
        )} */}
      </div>
    </>
  );
};

export default PendingOrderList;
