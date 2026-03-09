'use client';

import { useEffect, useState } from 'react';
import { useOrderFormActions } from '@/hooks/uses/orderform.hooks';
import { AuthenticatedContext } from '@/utils/context/auth.context';
import MainPageHeader from '@/components/mainPage/MainPageHeader';
import styles from './styles/test.market.module.css';
import chartStyles from '@/components/chart/styles/market.chart.module.css';
import { AuthUser } from '@/utils/api/auth.api';
import { UpbitCandleTimeframeUrl } from '@chart/shared-types';
import { DEFAULT_INDICATOR_OPTIONS } from '@/hooks/chart/indicatorTypes';
import IndicatorPanel from '@/components/chart/IndicatorPanel';
import LoadingSpinner from '@/components/LoadingSpinner';
import NewMarketTrade from '@/components/tradeList/MarketTrade';
import NewMarketOrderbookList from '@/components/orderbook/MarketOrderbookList';
import dynamic from 'next/dynamic';
import { useCandleChart } from '@/hooks/chart/useCandleChartV2';
import MarketCoinListPanel from './MarketCoinListPanel';
import MobileOrderFormSheet from './MobileOrderFormSheet';
import CoinInfoBar from './CoinInfoBar';
import OrderHistoryPanel from './OrderHistoryPanel';
import QuickOrderBar from './QuickOrderBar';
import WalletUninitializedView from '@/components/deposit/WalletUninitializedView';

const OrderForm = dynamic(() => import('@/components/order/OrderForm'), {
  ssr: false,
});

const CHART_TIMEFRAME_OPTIONS = [
  { label: '일', timeframe: 'days' as UpbitCandleTimeframeUrl },
  { label: '주', timeframe: 'weeks' as UpbitCandleTimeframeUrl },
  { label: '월', timeframe: 'months' as UpbitCandleTimeframeUrl },
  { label: '년', timeframe: 'years' as UpbitCandleTimeframeUrl },
] as const;

type Tab = 'chart' | 'orderbook' | 'trades' | 'order';

const TAB_LABELS: Record<Tab, string> = {
  chart: '차트',
  orderbook: '호가',
  trades: '체결',
  order: '주문내역',
};

interface TestMarketPageClientProps {
  user: AuthUser | null;
  code: string;
  initialIsFavorite?: boolean;
}

const TestMarketPageClient = ({
  user,
  code,
  initialIsFavorite = false,
}: TestMarketPageClientProps) => {
  const [tab, setTab] = useState<Tab>('chart');
  const [coinListOpen, setCoinListOpen] = useState(false);
  const [mobileOrderSheetOpen, setMobileOrderSheetOpen] = useState(false);
  const [chartTimeframe, setChartTimeframe] = useState<UpbitCandleTimeframeUrl>('days');

  const orderFormStore = useOrderFormActions();
  const {
    loading: chartLoading,
    chartMountRef,
    chartReady,
    indicatorOptions,
    setIndicatorOptions,
  } = useCandleChart({ code, timeframe: chartTimeframe });

  // PC 전환 시 모바일 UI 닫기
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1000px)');
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setMobileOrderSheetOpen(false);
      setCoinListOpen(false);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleChartTimeframeChange = (tf: UpbitCandleTimeframeUrl) => {
    if (!chartLoading) setChartTimeframe(tf);
  };

  return (
    <AuthenticatedContext.Provider value={!!user}>
      <div className={styles.page} data-tab={tab}>
        <MainPageHeader user={user} />

        {/* CoinInfoBar — wrapper div 이 compound selector(.page[data-tab] .coinInfoBar)의 타깃 */}
        <div className={styles.coinInfoBar}>
          <CoinInfoBar
            code={code}
            user={user}
            initialIsFavorite={initialIsFavorite}
            coinListOpen={coinListOpen}
            onCoinListOpen={() => setCoinListOpen((p) => !p)}
          />
        </div>

        {/* Mobile Tab Bar */}
        <div className={styles.mobileTabBar}>
          {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
            <button
              key={t}
              className={styles.mobileTabBtn}
              data-active={tab === t}
              onClick={() => setTab(t)}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className={styles.mainContent}>
          <div className={styles.contentGrid}>
            {/* Left Column: Chart + Bottom Panels */}
            <div className={styles.leftColumn}>
              {/* Chart */}
              <div className={styles.chartColumn}>
                <div
                  className={`${styles.containerLabel} ${styles.containerLabelNoBorder}`}
                >
                  <span className={styles.labelText}>차트</span>
                  <span className={styles.labelDivider} />
                  {CHART_TIMEFRAME_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      disabled={chartLoading}
                      className={`${chartStyles.button} ${chartTimeframe === opt.timeframe ? chartStyles.selected : ''}`}
                      onClick={() => handleChartTimeframeChange(opt.timeframe)}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <IndicatorPanel
                    options={indicatorOptions}
                    onChange={setIndicatorOptions}
                    onReset={() => setIndicatorOptions(DEFAULT_INDICATOR_OPTIONS)}
                  />
                </div>
                <div className={styles.chartContent}>
                  <div ref={chartMountRef} className={chartStyles.chartMount} />
                  {chartLoading && <div className={chartStyles.loading} />}
                  {!chartReady && (
                    <div className={chartStyles.spinnerWrapper}>
                      <LoadingSpinner />
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Row: Trade List + Order History */}
              <div className={styles.bottomRow}>
                <div className={styles.tradeListColumn}>
                  <div
                    className={`${styles.containerLabel} ${styles.containerLabelNoBorder}`}
                  >
                    <span className={styles.labelText}>시세</span>
                  </div>
                  <NewMarketTrade />
                </div>
                <div className={styles.orderHistoryColumn}>
                  <OrderHistoryPanel user={user} />
                </div>
              </div>
            </div>

            {/* Orderbook Column */}
            <div className={styles.orderbookColumn}>
              <div
                className={`${styles.containerLabel} ${styles.containerLabelNoBorder}`}
              >
                <span className={styles.labelText}>호가</span>
              </div>
              <NewMarketOrderbookList code={code} />
            </div>

            {/* OrderForm Column */}
            <div className={styles.orderFormColumn}>
              <div
                className={`${styles.containerLabel} ${styles.containerLabelNoBorder}`}
              >
                <span className={styles.labelText}>주문</span>
              </div>
              {user && !user.isInitialized ? (
                <WalletUninitializedView />
              ) : (
                <OrderForm code={code} hideHistory authenticated={!!user} />
              )}
            </div>
          </div>
        </div>

        {/* CoinList Panel */}
        {coinListOpen && <MarketCoinListPanel onClose={() => setCoinListOpen(false)} />}

        {/* Mobile QuickOrderBar */}
        <QuickOrderBar
          onBuy={() => {
            orderFormStore.setSide('BUY');
            setMobileOrderSheetOpen(true);
          }}
          onSell={() => {
            orderFormStore.setSide('SELL');
            setMobileOrderSheetOpen(true);
          }}
        />

        {/* Mobile Order Form Bottom Sheet */}
        {mobileOrderSheetOpen && (
          <MobileOrderFormSheet
            code={code}
            authenticated={!!user}
            isInitialized={!user || user.isInitialized}
            onClose={() => setMobileOrderSheetOpen(false)}
          />
        )}
      </div>
    </AuthenticatedContext.Provider>
  );
};

export default TestMarketPageClient;
