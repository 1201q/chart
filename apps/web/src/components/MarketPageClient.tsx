'use client';

import ExchangeHeader from '@/components/ExchangeHeader';
import styles from './styles/market.page.client.module.css';
import MarketInfo from '@/components/MarketInfo';
import { OrderFormProvider } from '@/components/provider/OrderFormProvider';
import OrderFormInit from '@/components/provider/OrderFormInit';

import BottomTabs from '@/components/BottomTabs';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tab } from '@/types/tabs.types';
import { useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import DesktopMarketLayout from './DesktopMarketLayout';
import MobileMarketLayout from './MobileMarketLayout';

export default function MarketPageClient({
  code,
  children,
  initialIsMobile,
}: {
  code: string;
  children: React.ReactNode;
  initialIsMobile: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const tabFromUrl = (params.get('tab') as Tab) ?? 'chart';

  const [selectedTab, setSelectedTab] = useState<Tab>(tabFromUrl);

  const isMobile = useIsMobile(1000, initialIsMobile);

  useEffect(() => {
    setSelectedTab(tabFromUrl);
  }, [tabFromUrl]);

  const onTabChange = (next: Tab) => {
    setSelectedTab(next);

    const p = new URLSearchParams(params.toString());
    p.set('tab', next);
    router.replace(`?${p.toString()}`);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <ExchangeHeader code={code} />
      </div>
      <div className={styles.main}>
        <div className={styles.mainWrapper}>
          {(!isMobile || (isMobile && selectedTab === 'chart')) && (
            <MarketInfo code={code} />
          )}
          <div className={styles.contentsWrapper}>
            <OrderFormProvider key={code}>
              <OrderFormInit code={code} />
              {isMobile ? (
                <MobileMarketLayout code={code} currentTab={selectedTab}>
                  {children}
                </MobileMarketLayout>
              ) : (
                <DesktopMarketLayout code={code}>{children}</DesktopMarketLayout>
              )}
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
