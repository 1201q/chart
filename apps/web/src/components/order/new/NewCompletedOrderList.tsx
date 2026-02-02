'use client';

import styles from '../styles/order.form.history.module.css';

import { useCompletedOrders } from '@/hooks/uses/trading.hooks';
import CompletedOrderItem from './NewCompletedOrderItem';

const CompletedOrderList = () => {
  const list = useCompletedOrders();

  return (
    <>
      <div className={styles.listViewport}>
        <div className={styles.completedList}>
          {list.map((o) => (
            <CompletedOrderItem key={o.id} data={o} />
          ))}
        </div>
        {list.length === 0 && (
          <div className={styles.emptyList}>
            <span>주문 내역이 없습니다.</span>
          </div>
        )}
      </div>
    </>
  );
};

export default CompletedOrderList;
