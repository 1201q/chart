'use client';

import { TradingOrderDto } from '@chart/shared-types';
import styles from './styles/order.form.order.item.module.css';
import { useOrderFillMetrics } from '@/hooks/uses/trading.hooks';

const CompletedOrderItem = ({ data }: { data: TradingOrderDto }) => {
  const canceled = data.status === 'CANCELED';

  const metrics = useOrderFillMetrics(data.id);

  return (
    <div className={styles.completedTradeItem}>
      <div className={`${styles.leftWrapper} ${canceled ? styles.canceled : ''}`}>
        <span className={styles.date}>
          {new Date(data.createdAt)
            .toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })
            .replace(/\. /g, '.')
            .replace(/\.$/, '')}
        </span>

        <div
          className={`${styles.tradeType} ${data.side === 'BUY' ? styles.rise : styles.fall}`}
        >
          {data.side === 'BUY' ? '매수' : '매도'}
        </div>
      </div>
      {!canceled && (
        <div className={styles.rightWrapper}>
          <span>
            {metrics.filledSum.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
          </span>
        </div>
      )}
    </div>
  );
};

export default CompletedOrderItem;
