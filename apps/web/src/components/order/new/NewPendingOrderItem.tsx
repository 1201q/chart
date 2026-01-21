'use client';

import { TradingOrderDto } from '@chart/shared-types';
import styles from '../styles/order.form.order.item.module.css';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useState } from 'react';
import { cancelOrder } from '@/utils/api/orders.api';

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
      <CancelButton orderId={data.id} />
    </div>
  );
};

function CancelButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);

  const onCancel = async () => {
    if (loading) return;
    setLoading(true);

    try {
      await cancelOrder(orderId);
    } catch {
      alert('주문 취소에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.buttonWrapper}>
      <button
        className={`${styles.cancelButton} ${loading ? styles.loading : ''}`}
        type="button"
        disabled={loading}
        onClick={onCancel}
      >
        {loading && <LoadingSpinner size={10} color="var(--blue400)" />}
        {!loading && <span className={styles.cancelText}>취소</span>}
      </button>
    </div>
  );
}

export default PendingOrderItem;
