'use client';

import { Tab } from '@/types/tabs.types';
import styles from './styles/market.page.mobile.client.module.css';
import MarketTrade from '@/components/tradeList/MarketTrade';
import MarketChart from '@/components/chart/MarketChart';

import OrderForm from '@/components/order/OrderForm';

const MobileMarketLayout = ({
  currentTab,
  code,
  children,
}: {
  currentTab: Tab;
  code: string;
  children: React.ReactNode;
}) => {
  return (
    <>
      {currentTab === 'chart' && (
        <div className={styles.chartPadding}>
          <MarketChart code={code} />
        </div>
      )}
      {currentTab === 'order' && (
        <div className={styles.orderformPadding}>
          <OrderForm code={code} />
        </div>
      )}
      {currentTab === 'orderbook' && (
        <div className={styles.orderbookPadding}>{children}</div>
      )}

      {currentTab === 'trades' && (
        <div className={styles.tradesPadding}>
          <MarketTrade />
        </div>
      )}
    </>
  );
};

export default MobileMarketLayout;
