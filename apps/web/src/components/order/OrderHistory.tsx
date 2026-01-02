'use client';

import { useState } from 'react';
import CompletedOrderItem from './CompletedOrderItem';
import styles from './styles/order.form.history.module.css';

const TABS = [
  { label: '대기', key: 'pending' },
  { label: '완료', key: 'completed' },
] as const;

const OrderHistory = () => {
  const [selectedTab, setSelectedTab] = useState<(typeof TABS)[number]['key']>('pending');

  return (
    <div className={styles.history}>
      <div className={styles.historyTitle}>
        <h4>주문내역</h4>
      </div>
      <div className={styles.historyMenu}>
        {TABS.map((tab) => (
          <button
            onClick={() => setSelectedTab(tab.key)}
            className={`${tab.key === selectedTab ? styles.selected : ''}`}
            key={tab.key}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      <div className={styles.contentWrapper}>
        <div className={styles.emptyList}>
          <span>주문 내역이 없습니다.</span>
        </div>
        <div className={styles.listViewport}>
          <div className={styles.completedList}>
            <CompletedOrderItem />
            <CompletedOrderItem />
            <CompletedOrderItem />
            <CompletedOrderItem />
            <CompletedOrderItem />
            <CompletedOrderItem />
            <CompletedOrderItem />
            <CompletedOrderItem />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderHistory;
