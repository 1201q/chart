'use client';

import styles from './styles/account.tabs.module.css';

const TABS: { id: string; label: string }[] = [
  {
    id: 'assets',
    label: '자산',
  },
  {
    id: 'orders',
    label: '주문내역',
  },
  {
    id: 'profit',
    label: '수익',
  },
];

const AccountTabs = () => {
  const selectedTab = 'assets';

  return (
    <div className={styles.tabsWrapper}>
      <div className={styles.tabs}>
        {TABS.map((tab) => {
          const isActive = selectedTab === tab.id;

          return (
            <button
              key={tab.id}
              className={`${styles.tab} ${isActive ? styles.activeTab : ''}`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AccountTabs;
