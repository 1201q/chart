'use client';

import styles from './styles/order.form.tabs.module.css';
import { flushSync } from 'react-dom';

type OrderMode = 'buy' | 'sell';

interface OrderFormTabsProps {
  selectedTab: OrderMode;
  onTabChange: (tab: OrderMode) => void;
}

const TABS: { id: OrderMode; label: string }[] = [
  { id: 'buy', label: '매수' },
  { id: 'sell', label: '매도' },
];

const OrderFormTabs = ({ selectedTab, onTabChange }: OrderFormTabsProps) => {
  const handleTabClick = (tabId: OrderMode) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc: any = document;

    if (doc.startViewTransition) {
      doc.startViewTransition(() => {
        flushSync(() => onTabChange(tabId));
      });
    } else {
      onTabChange(tabId);
    }
  };

  return (
    <div
      className={`${styles.tabs} ${selectedTab === 'buy' ? styles.buyTab : styles.sellTab}`}
    >
      <div className={styles.tabWrapper}>
        {TABS.map((tab) => {
          const isActive = selectedTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`${styles.tab} ${isActive ? styles.activeTab : ''}`}
            >
              <span style={{ viewTransitionName: `tab-label-${tab.id}` }}>
                {tab.label}
              </span>
              {isActive && <div className={styles.pill}></div>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default OrderFormTabs;
