'use client';

import { OrderSide } from '@chart/shared-types';
import styles from '../styles/order.form.order.item.module.css';
import { CompletedOrderWithFills } from './NewCompletedOrderList';

const CompletedOrderItem = ({
  side,
  filledAt,
  data,
}: {
  side: OrderSide;
  filledAt: Date;
  data: CompletedOrderWithFills;
}) => {
  const canceled = data.status === 'CANCELED';

  const total = data.fills.reduce(
    (acc, fill) => acc + Number(fill.qty) * Number(fill.price),
    0,
  );

  return (
    <div className={styles.completedTradeItem}>
      <div className={`${styles.leftWrapper} ${canceled ? styles.canceled : ''}`}>
        <div className={styles.date}>
          {new Date(filledAt)
            .toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })
            .replace(/\. /g, '.')
            .replace(/\.$/, '')}
        </div>

        <div
          className={`${styles.tradeType} ${data.side === 'BUY' ? styles.rise : styles.fall}`}
        >
          {side === 'BUY' ? '매수' : '매도'}
        </div>
      </div>
      {!canceled && (
        <div className={styles.rightWrapper}>
          <span>{total.toLocaleString('ko-KR')}원</span>
        </div>
      )}
    </div>
  );
};

export default CompletedOrderItem;
