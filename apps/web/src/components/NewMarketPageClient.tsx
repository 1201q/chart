'use client';

import styles from './styles/market.page.client.module.css';

import BottomTabs from '@/components/BottomTabs';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tab } from '@/types/tabs.types';
import { useState } from 'react';

import NewExchangeHeader from './header/NewExchangeHeader';
import NewMarketInfo from './NewMarketInfo';

// import MarketOrderbookList from './orderbook/new/NewMarketOrderbookList';
// import MarketTrade from './tradeList/new/NewMarketTrade';
import CoinInfo from './coinInfo/new/NewCoinInfo';

import MarketChart from './chart/new/NewMarketChart';

import dynamic from 'next/dynamic';
import MarketTradeListSkeleton from './tradeList/new/NewMarketTradeListSkeleton';
import MarketOrderbookListSkeleton from './orderbook/new/NewMarketOrderbookListSkeleton';
import NewOrderFormInit from './provider/NewOrderFormInit';
// import OrderFormInit from './provider/OrderFormInit';
// import OrderForm from './order/new/NewOrderForm';

const OrderForm = dynamic(() => import('./order/new/NewOrderForm'), {
  ssr: false,
});

const MarketOrderbookList = dynamic(
  () => import('./orderbook/new/NewMarketOrderbookList'),
  { ssr: false, loading: () => <MarketOrderbookListSkeleton /> },
);

const MarketTrade = dynamic(() => import('./tradeList/new/NewMarketTrade'), {
  ssr: false,
  loading: () => <MarketTradeListSkeleton />,
});

const NewMarketPageClient = ({ code, initialTab }: { code: string; initialTab: Tab }) => {
  const router = useRouter();
  const params = useSearchParams();

  const [selectedTab, setSelectedTab] = useState<Tab>(initialTab);

  const onTabChange = (next: Tab) => {
    if (next === selectedTab) return;

    setSelectedTab(next);

    const p = new URLSearchParams(params.toString());
    p.set('tab', next);
    router.replace(`?${p.toString()}`);
  };

  return (
    <div className={styles.page} data-tab={selectedTab}>
      <div className={styles.header}>
        <NewExchangeHeader code={code} selectedTab={selectedTab} />
      </div>
      <div className={styles.main}>
        <div className={styles.mainWrapper}>
          <div className={styles.marketInfoArea}>
            <NewMarketInfo code={code} />
          </div>
          <div className={styles.contentsWrapper}>
            <NewOrderFormInit code={code} />
            <div className={styles.leftWrapper}>
              <div className={styles.chartPanel}>
                <MarketChart code={code} />
              </div>
              <div className={styles.coinInfoWrapper}>
                <section>
                  <h2>가격 상태</h2>
                  <CoinInfo code={code} />
                </section>
              </div>
              <div className={styles.orderbookAndTrades}>
                <section className={styles.orderbookSection}>
                  <h2>호가</h2>
                  <MarketOrderbookList code={code} />
                </section>
                <section className={styles.tradesSection}>
                  <h2>체결</h2>
                  <MarketTrade />
                </section>
              </div>
            </div>
            <div className={styles.rightWrapper}>
              <OrderForm code={code} />
            </div>
          </div>
        </div>
      </div>
      <nav className={styles.bottomTabs}>
        <BottomTabs selectedTab={selectedTab} onTabChange={onTabChange} />
      </nav>
    </div>
  );
};

export default NewMarketPageClient;
