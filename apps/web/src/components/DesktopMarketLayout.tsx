'use client';

import styles from './styles/market.page.client.module.css';

import MarketTrade from '@/components/tradeList/MarketTrade';
import MarketChart from '@/components/chart/MarketChart';

import OrderForm from '@/components/order/OrderForm';
import CoinInfo from '@/components/coinInfo/CoinInfo';

const DesktopMarketLayout = ({
  code,
  children,
}: {
  code: string;
  children: React.ReactNode;
}) => {
  return (
    <>
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
    </>
  );
};

export default DesktopMarketLayout;
