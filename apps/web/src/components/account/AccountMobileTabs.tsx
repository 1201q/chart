'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './styles/account.mobile.tabs.module.css';

const TABS = [
  { id: 'assets', label: '자산', href: '/account/assets' },
  { id: 'orders', label: '주문내역', href: '/account/orders' },
];

const AccountMobileTabs = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (searchParams.get('id')) return null;

  return (
    <div className={styles.tabsWrapper}>
      {TABS.map((tab) => {
        const isActive = pathname.startsWith(`/account/${tab.id}`);

        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`${styles.tab} ${isActive ? styles.activeTab : ''}`}
          >
            <span className={styles.label}>{tab.label}</span>
            {isActive && <div className={styles.pill} />}
          </Link>
        );
      })}
    </div>
  );
};

export default AccountMobileTabs;
