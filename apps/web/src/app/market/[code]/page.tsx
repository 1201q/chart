import ExchangeHeader from '@/components/ExchangeHeader';

import styles from './page.module.css';
import MarketInfo from '@/components/MarketInfo';
import MarketTrade from '@/components/tradeList/MarketTrade';
import MarketChart from '@/components/chart/MarketChart';
import MarketOrderbook from '@/components/orderbook/MarketOrderbook';

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <ExchangeHeader code={code} />
      </div>
      <div className={styles.main}>
        <div className={styles.contentsWrapper}>
          <MarketInfo code={code} />
          <MarketChart code={code} />
          <div className={styles.orderbookAndTrades}>
            <section>
              <h2>호가</h2>

              <MarketOrderbook code={code} />
            </section>
            <section>
              <h2>체결</h2>

              <MarketTrade code={code} />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
