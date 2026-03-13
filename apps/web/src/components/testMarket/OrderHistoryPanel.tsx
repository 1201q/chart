'use client';

import { useState } from 'react';
import { AuthUser } from '@/utils/api/auth.api';
import NewPendingOrderList from '@/components/order/PendingOrderList';
import NewCompletedOrderList from '@/components/order/CompletedOrderList';
// test.market.module.css를 공유: compound selector(.page[data-tab='order'] .historyTabBar 등)가
// 페이지 루트의 .page 와 연동되므로 같은 CSS 모듈을 참조해야 함
import styles from './styles/test.market.module.css';

type HistoryTab = 'pending' | 'completed';

interface OrderHistoryPanelProps {
  user: AuthUser | null;
}

const OrderHistoryPanel = ({ user }: OrderHistoryPanelProps) => {
  const [historyTab, setHistoryTab] = useState<HistoryTab>('pending');

  return (
    <>
      <div className={styles.historyTabBar}>
        <button
          className={styles.historyTabBtn}
          data-active={historyTab === 'pending'}
          onClick={() => setHistoryTab('pending')}
        >
          미체결 주문
        </button>
        <button
          className={styles.historyTabBtn}
          data-active={historyTab === 'completed'}
          onClick={() => setHistoryTab('completed')}
        >
          체결 내역
        </button>
      </div>
      <div className={styles.historyContent}>
        {user ? (
          <>
            <div data-active={historyTab === 'pending'} className={styles.historySection}>
              <span className={styles.mobileSectionLabel}>미체결 주문</span>
              <NewPendingOrderList />
            </div>
            <div
              data-active={historyTab === 'completed'}
              className={styles.historySection}
            >
              <span className={styles.mobileSectionLabel}>체결 내역</span>
              <NewCompletedOrderList />
            </div>
          </>
        ) : (
          <div className={styles.loginPrompt}>
            <span className={styles.loginPromptText}>
              주문 내역을 보려면
              <br />
              로그인이 필요해요
            </span>
            <a href="/login" className={styles.loginPromptBtn}>
              로그인하기
            </a>
          </div>
        )}
      </div>
    </>
  );
};

export default OrderHistoryPanel;
