import ExchangeHeader from '@/components/ExchangeHeader';

import styles from './page.module.css';
import MarketInfo from '@/components/MarketInfo';
import MarketTrade from '@/components/tradeList/MarketTrade';
import MarketChart from '@/components/chart/MarketChart';
import MarketOrderbook from '@/components/orderbook/MarketOrderbook';
import OrderForm from '@/components/order/OrderForm';

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <ExchangeHeader code={code} />
      </div>
      <div className={styles.main}>
        <div className={styles.mainWrapper}>
          <MarketInfo code={code} />
          <div className={styles.contentsWrapper}>
            <div className={styles.leftWrapper}>
              <MarketChart code={code} />
              <div className={styles.orderbookAndTrades}>
                <section>
                  <h2>호가</h2>
                  <MarketOrderbook code={code} />
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
          </div>
        </div>
      </div>
    </div>
  );
}
