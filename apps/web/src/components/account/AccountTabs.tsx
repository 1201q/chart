'use client';

import { usePathname } from 'next/navigation';
import styles from './styles/account.tabs.module.css';
import Link from 'next/link';

const TABS: { id: string; label: string }[] = [
  {
    id: 'assets',
    label: '자산',
  },
  {
    id: 'orders',
    label: '주문내역',
  },
];

const AccountTabs = () => {
  const pathname = usePathname();

  return (
    <div className={styles.tabsWrapper}>
      <div className={styles.tabs}>
        {TABS.map((tab) => {
          const selectedTab = pathname.split('/account/')[1];
          let isActive = false;

          if (selectedTab) {
            isActive = selectedTab.startsWith(tab.id);
          }

          return (
            <Link href={`/account/${tab.id}`} key={tab.id}>
              <button className={`${styles.tab} ${isActive ? styles.activeTab : ''}`}>
                <span>{tab.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default AccountTabs;
