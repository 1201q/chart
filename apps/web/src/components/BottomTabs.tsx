'use client';

import styles from './styles/bottom.tabs.module.css';
import Chart from '../../public/chart.svg';
import Orderbook from '../../public/orderbook.svg';
import Trade from '../../public/trade.svg';

import { ReactNode } from 'react';
import { flushSync } from 'react-dom';

import { TrendingUp, ArrowLeft } from 'lucide-react';
import { Tab } from '@/types/tabs.types';

const TABS: { id: Tab; label: string; icon?: ReactNode }[] = [
  {
    id: 'chart',
    label: '차트',
    icon: (
      <Chart
        className={styles.logo}
        style={{ top: '0px', width: '25px', height: '25px' }}
      />
    ),
  },
  {
    id: 'orderbook',
    label: '호가',
    icon: (
      <Orderbook
        className={styles.logo}
        style={{ top: '0px', width: '24px', height: '24px' }}
      />
    ),
  },
  {
    id: 'trades',
    label: '체결',
    icon: (
      <Trade
        className={styles.logo}
        style={{ top: '-1px', width: '24px', height: '24px' }}
      />
    ),
  },
  {
    id: 'order',
    label: '주문',
    icon: (
      <TrendingUp
        className={styles.logo}
        strokeWidth={4}
        strokeLinecap="round"
        size={18}
      />
    ),
  },
];

const BottomTabs = ({
  selectedTab,
  onTabChange,
}: {
  selectedTab: Tab;
  onTabChange: (t: Tab) => void;
}) => {
  const handleTabClick = (tabId: Tab) => {
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
    <>
      <button className={styles.homeButton}>
        <ArrowLeft size={20} color="var(--grey600)" />
      </button>
      <div className={styles.tabsWrapper}>
        <div className={styles.tabs}>
          {TABS.map((tab) => {
            const isActive = selectedTab === tab.id;

            return (
              <button
                onClick={() => handleTabClick(tab.id)}
                key={tab.id}
                className={`${styles.tab} ${isActive ? styles.activeTab : ''}`}
              >
                {tab.icon}
                <span style={{ viewTransitionName: `bottomTab-label-${tab.id}` }}>
                  {tab.label}
                </span>
                {isActive && <div className={styles.pill}></div>}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default BottomTabs;
