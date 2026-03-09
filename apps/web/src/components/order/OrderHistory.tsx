'use client';

import { useState } from 'react';

import styles from './styles/order.form.history.module.css';
import CompletedOrderList from './CompletedOrderList';
import PendingOrderList from './PendingOrderList';

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
        {selectedTab === 'completed' && <CompletedOrderList />}
        {selectedTab === 'pending' && <PendingOrderList />}
      </div>
    </div>
  );
};

export default OrderHistory;
