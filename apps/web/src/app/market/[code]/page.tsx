import ExchangeHeader from '@/components/ExchangeHeader';

import styles from './page.module.css';
import MarketInfo from '@/components/MarketInfo';
import MarketTrade from '@/components/tradeList/MarketTrade';
import MarketChart from '@/components/chart/MarketChart';
import MarketOrderbook from '@/components/orderbook/MarketOrderbook';
import OrderForm from '@/components/order/OrderForm';
import CoinInfo from '@/components/coinInfo/CoinInfo';
import { OrderFormProvider } from '@/components/provider/OrderFormProvider';
import OrderFormInit from '@/components/provider/OrderFormInit';

import { MarketInfo as MarketInfoType } from '@chart/shared-types';
import { notFound } from 'next/navigation';

const getMarkets = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/markets`);

  if (!res.ok) {
    return [];
  }

  const json = (await res.json()) as MarketInfoType[];

  const symbols = json.map((market) => market.code);

  return symbols;
};

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const markets = await getMarkets();

  // 유효한 심볼인지 검사
  if (!markets.includes(code)) {
    notFound();
  }

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
            </OrderFormProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
