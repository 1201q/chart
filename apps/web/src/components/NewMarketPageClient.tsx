'use client';

import styles from './styles/market.page.client.module.css';

import { OrderFormProvider } from '@/components/provider/OrderFormProvider';
import OrderFormInit from '@/components/provider/OrderFormInit';

import BottomTabs from '@/components/BottomTabs';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tab } from '@/types/tabs.types';
import { useEffect, useState } from 'react';

import MarketChart from './chart/MarketChart';
import CoinInfo from './coinInfo/CoinInfo';
import MarketTrade from './tradeList/MarketTrade';
import OrderForm from './order/OrderForm';
import NewExchangeHeader from './header/NewExchangeHeader';
import NewMarketInfo from './NewMarketInfo';
import React from 'react';
import MarketOrderbookList from './orderbook/new/NewMarketOrderbookList';

const NewMarketPageClient = ({ code }: { code: string }) => {
  const router = useRouter();
  const params = useSearchParams();

  console.count('NewMarketPageClient render');

  const tabFromUrl = (params.get('tab') as Tab) ?? 'chart';

  const [selectedTab, setSelectedTab] = useState<Tab>(tabFromUrl);

  useEffect(() => {
    setSelectedTab(tabFromUrl);
  }, [tabFromUrl]);

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
            <OrderFormProvider>
              <OrderFormInit code={code} />
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
            </OrderFormProvider>
          </div>
        </div>
      </div>
      <nav className={styles.bottomTabs}>
        <BottomTabs selectedTab={selectedTab} onTabChange={onTabChange} />
      </nav>
    </div>
  );
};

export default React.memo(NewMarketPageClient);
