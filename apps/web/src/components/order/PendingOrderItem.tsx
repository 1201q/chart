'use client';

import { TradingOrderDto } from '@chart/shared-types';
import styles from './styles/order.form.order.item.module.css';

const PendingOrderItem = ({ data }: { data: TradingOrderDto }) => {
  return (
    <div className={styles.completedTradeItem}>
      <div className={`${styles.leftWrapper} `}>
        <div className={styles.date}>
          {new Date(data.createdAt)
            .toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })
            .replace(/\. /g, '.')
            .replace(/\.$/, '')}
        </div>

        <div
          className={`${styles.tradeType} ${data.side === 'BUY' ? styles.rise : styles.fall}`}
        >
          {data.side === 'BUY' ? '매수' : '매도'}
        </div>
      </div>
      {/* {!canceled && (
        <div className={styles.rightWrapper}>
          <span>{total.toLocaleString('ko-KR')}원</span>
        </div>
      )} */}
    </div>
  );
};

export default PendingOrderItem;
