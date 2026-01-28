/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import styles from './styles/account.order.controller.module.css';
import { flushSync } from 'react-dom';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

type OrdersTab = 'all' | 'buy' | 'sell';

const TABS: { id: OrdersTab; label: string }[] = [
  {
    id: 'all',
    label: '전체',
  },
  {
    id: 'buy',
    label: '매수',
  },
  {
    id: 'sell',
    label: '매도',
  },
];

const AccountOrderController = ({ isDetail }: { isDetail: boolean }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const side = (searchParams.get('side') ?? 'all') as OrdersTab;

  const [selectedTab, setSelectedTab] = useState<OrdersTab>(side);

  const handleTabClick = (tabId: OrdersTab) => {
    const doc: any = document;
    doc.startViewTransition(() => {
      flushSync(() => setSelectedTab(tabId));
    });
  };

  return (
    <div className={`${styles.controller} ${isDetail ? styles.hidden : ''}`}>
      <div className={styles.tabsWrapper}>
        {TABS.map((tab) => {
          const selected = selectedTab === tab.id;
          const params = new URLSearchParams(searchParams.toString());
          params.set('side', tab.id);

          const href = `${'/account/orders'}?${params.toString()}`;

          return (
            <Link
              href={href}
              onClick={() => handleTabClick(tab.id)}
              className={`${styles.tab} ${selected ? styles.activeTab : ''}`}
              key={tab.id}
              style={{ viewTransitionName: `orders-tab-${tab.id}` }}
            >
              <span>{tab.label}</span>
              {selected && <div className={styles.line}></div>}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default AccountOrderController;
