'use client';

import ExchangeHeader from '@/components/ExchangeHeader';
import styles from './styles/market.page.client.module.css';
import MarketInfo from '@/components/MarketInfo';
import MarketTrade from '@/components/tradeList/MarketTrade';
import MarketChart from '@/components/chart/MarketChart';

import OrderForm from '@/components/order/OrderForm';
import CoinInfo from '@/components/coinInfo/CoinInfo';
import { OrderFormProvider } from '@/components/provider/OrderFormProvider';
import OrderFormInit from '@/components/provider/OrderFormInit';

import BottomTabs from '@/components/BottomTabs';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tab } from '@/types/tabs.types';
import { useEffect, useState } from 'react';

export default function MarketPageClient({
  code,
  children,
}: {
  code: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const tabFromUrl = (params.get('tab') as Tab) ?? 'chart';

  const [selectedTab, setSelectedTab] = useState<Tab>(tabFromUrl);

  useEffect(() => {
    setSelectedTab(tabFromUrl);
  }, [tabFromUrl]);

  const onTabChange = (next: Tab) => {
    setSelectedTab(next);

    const p = new URLSearchParams(params.toString());
    p.set('tab', next);
    router.replace(`?${p.toString()}`, { scroll: false });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <ExchangeHeader code={code} />
      </div>
      <div className={styles.main}>
        <div className={styles.mainWrapper}>
          <MarketInfo code={code} />
          <div className={styles.contentsWrapper}>
            <OrderFormProvider key={code}>
              <OrderFormInit code={code} />
              <div className={styles.leftWrapper}>
                <MarketChart code={code} />
                <div className={styles.coinInfoWrapper}>
                  <section>
                    <h2>가격 상태</h2>
                    <CoinInfo code={code} />
                  </section>
                </div>
                <div className={styles.orderbookAndTrades}>
                  <section>
                    <h2>호가</h2>
                    {children}
                  </section>
                  <section>
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
}
