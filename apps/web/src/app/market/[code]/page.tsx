import ExchangeHeader from '@/components/ExchangeHeader';

import MarketChart from '@/components/MarketChart';

import styles from './page.module.css';
import MarketInfo from '@/components/MarketInfo';

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

          <div style={{ height: '100dvh' }}></div>
        </div>
      </div>
    </div>
  );
}
