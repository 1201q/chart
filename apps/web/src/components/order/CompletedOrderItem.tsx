'use client';

import { OrderSide } from '@chart/shared-types';
import styles from './styles/order.form.order.item.module.css';

const CompletedOrderItem = ({ side, filledAt }: { side: OrderSide; filledAt: Date }) => {
  return (
    <div className={styles.completedTradeItem}>
      <div className={styles.leftWrapper}>
        <div className={styles.date}>{1}</div>
        <div className={`${styles.tradeType} ${styles.even}`}>
          {side === 'BUY' ? '매수' : '매도'}
        </div>
      </div>
      <div className={styles.rightWrapper}>
        <span>2,750원</span>
      </div>
    </div>
  );
};

export default CompletedOrderItem;
