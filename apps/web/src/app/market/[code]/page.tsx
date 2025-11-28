import ExchangeHeader from '@/components/ExchangeHeader';

import MarketChart from '@/components/MarketChart';

import styles from './page.module.css';
import MarketInfo from '@/components/MarketInfo';
import MarketTrade from '@/components/MarketTrade';

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <ExchangeHeader code={code} />
      </div>
      <div className={styles.main}>
        <div className={styles.contentsWrapper}>
          {/* <MarketTabs /> */}
          {/* <MarketChartController /> */}
          <MarketInfo code={code} />
          <MarketChart code={code} timeframe="days" />
          <div className={styles.orderbookAndTrades}>
            <section>
              <h2>호가</h2>
            </section>
            <section>
              <h2>체결</h2>
              <div>
                <MarketTrade code={code} />
              </div>
            </section>
          </div>
          <div style={{ height: '100dvh' }}></div>
        </div>
      </div>
    </div>
  );
}
