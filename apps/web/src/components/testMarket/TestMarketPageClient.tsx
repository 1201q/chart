'use client';

import { useEffect, useMemo, useState } from 'react';
import { useOrderFormActions } from '@/hooks/uses/orderform.hooks';
import { AuthenticatedContext } from '@/utils/context/auth.context';
import Image from 'next/image';
import { ChevronDown, Star } from 'lucide-react';
import MainPageHeader from '@/components/mainPage/MainPageHeader';
import styles from './styles/test.market.module.css';
import chartStyles from '@/components/chart/styles/market.chart.module.css';
import { AuthUser } from '@/utils/api/auth.api';
import { useTickerSelector2, useTickerStore } from '@/hooks/uses/tickers.hooks';
import { useRouter } from 'next/navigation';
import { toggleFavorite } from '@/utils/api/favorites.api';
import { createKrwPriceFormatter } from '@/utils/formatting/price';
import { createKrwVolumeFormatter } from '@/utils/formatting/volume';
import { formatAccTradePriceKRW } from '@/utils/formatting/accTradePriceKRW';
import { formatChangeRate } from '@/utils/formatting/changeRate';
import { useCandleChart } from '@/hooks/chart/useCandleChartV2';
import { UpbitCandleTimeframeUrl } from '@chart/shared-types';
import { DEFAULT_INDICATOR_OPTIONS } from '@/hooks/chart/indicatorTypes';
import IndicatorPanel from '@/components/chart/new/IndicatorPanel';
import LoadingSpinner from '@/components/LoadingSpinner';
import NewMarketTrade from '@/components/tradeList/new/NewMarketTrade';
import NewMarketOrderbookList from '@/components/orderbook/new/NewMarketOrderbookList';
import NewPendingOrderList from '@/components/order/new/NewPendingOrderList';
import NewCompletedOrderList from '@/components/order/new/NewCompletedOrderList';
import dynamic from 'next/dynamic';
import MarketCoinListPanel from './MarketCoinListPanel';
import MobileOrderFormSheet from './MobileOrderFormSheet';

const OrderForm = dynamic(() => import('@/components/order/new/NewOrderForm'), {
  ssr: false,
});

const CHART_TIMEFRAME_OPTIONS = [
  { label: '일', timeframe: 'days' as UpbitCandleTimeframeUrl },
  { label: '주', timeframe: 'weeks' as UpbitCandleTimeframeUrl },
  { label: '월', timeframe: 'months' as UpbitCandleTimeframeUrl },
  { label: '년', timeframe: 'years' as UpbitCandleTimeframeUrl },
] as const;

type Tab = 'chart' | 'orderbook' | 'trades' | 'order';
type HistoryTab = 'pending' | 'completed';

interface TestMarketPageClientProps {
  user: AuthUser | null;
  code: string;
  initialIsFavorite?: boolean;
}

function getPriceBucketKey(price: number) {
  if (!Number.isFinite(price)) return 'default';
  if (price >= 100) return 'ge100';
  if (price >= 10) return '10-100';
  if (price >= 1) return '1-10';
  if (price >= 0.1) return '0.1-1';
  return 'lt0.1';
}

function getPriceForBucketKey(key: string) {
  switch (key) {
    case 'ge100':
      return 100;
    case '10-100':
      return 10;
    case '1-10':
      return 1;
    case '0.1-1':
      return 0.1;
    case 'lt0.1':
      return 0.01;
    default:
      return 1;
  }
}

function useStableKrwFormatter(price: number) {
  const key = getPriceBucketKey(price);
  const represent = useMemo(() => getPriceForBucketKey(key), [key]);
  return useMemo(() => createKrwPriceFormatter(represent), [represent]);
}

const TestMarketPageClient = ({
  user,
  code,
  initialIsFavorite = false,
}: TestMarketPageClientProps) => {
  const [tab, setTab] = useState<Tab>('chart');
  const [historyTab, setHistoryTab] = useState<HistoryTab>('pending');
  const [coinListOpen, setCoinListOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [mobileOrderSheetOpen, setMobileOrderSheetOpen] = useState(false);
  const orderFormStore = useOrderFormActions();
  const router = useRouter();

  // PC 뷰포트(≥1000px)로 전환 시 바텀시트 닫기
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1000px)');
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setMobileOrderSheetOpen(false);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  const tickerStore = useTickerStore();

  // 차트 상태 (컨트롤러를 레이블 행으로 이동하기 위해 끌어올림)
  const [chartTimeframe, setChartTimeframe] = useState<UpbitCandleTimeframeUrl>('days');
  const {
    loading: chartLoading,
    chartMountRef,
    chartReady,
    indicatorOptions,
    setIndicatorOptions,
  } = useCandleChart({ code, timeframe: chartTimeframe });
  const handleChartTimeframeChange = (tf: UpbitCandleTimeframeUrl) => {
    if (chartLoading) return;
    setChartTimeframe(tf);
  };

  // Ticker 데이터
  const tradePrice = useTickerSelector2(code, (s) => s?.tradePrice ?? 0);
  const signedChangePrice = useTickerSelector2(code, (s) => s?.signedChangePrice ?? 0);
  const changeRate = useTickerSelector2(code, (s) => s?.changeRate ?? 0);
  const change = useTickerSelector2(code, (s) => s?.change ?? 'EVEN');
  const highPrice = useTickerSelector2(code, (s) => s?.highPrice ?? 0);
  const lowPrice = useTickerSelector2(code, (s) => s?.lowPrice ?? 0);
  const prevClosingPrice = useTickerSelector2(code, (s) => s?.prevClosingPrice ?? 0);
  const accTradeVolume24h = useTickerSelector2(code, (s) => s?.accTradeVolume24h ?? 0);
  const accTradePrice24h = useTickerSelector2(code, (s) => s?.accTradePrice24h ?? 0);

  const koreanName = useTickerSelector2(code, (s) => s?.koreanName ?? '');

  // 포매터
  const priceFormatter = useStableKrwFormatter(tradePrice);
  const priceBucketKey = getPriceBucketKey(tradePrice);
  const volumeFormatter = useMemo(
    () => createKrwVolumeFormatter(getPriceForBucketKey(priceBucketKey)),
    [priceBucketKey],
  );

  const changeParts = priceFormatter.formatDiffParts(signedChangePrice);
  const accTradeAmountFmt = formatAccTradePriceKRW(accTradePrice24h);

  const dataPositive = change === 'RISE' ? 'true' : change === 'FALL' ? 'false' : 'even';

  const assetSymbol = code.replace('KRW-', '');

  const iconSrc = `https://api.chartraders.club/markets/icon/${assetSymbol.toUpperCase()}`;

  return (
    <AuthenticatedContext.Provider value={!!user}>
      <div className={styles.page} data-tab={tab}>
        {/* Header */}
        <MainPageHeader user={user} />

        {/* CoinInfoBar */}
        <div className={styles.coinInfoBar}>
          {/* 코인 선택 영역 */}
          <div className={styles.coinSelectorArea}>
            {/* 코인 목록 토글 버튼: 이름 행만 */}
            <button
              className={styles.coinSelector}
              onClick={() => setCoinListOpen((prev) => !prev)}
            >
              <div className={styles.coinNameRow}>
                <div className={styles.coinIcon}>
                  <Image src={iconSrc} alt={assetSymbol} width={22} height={22} />
                </div>
                <span className={styles.coinSymbol}>{koreanName}</span>
                <span className={styles.selectorChevron} data-open={coinListOpen}>
                  <ChevronDown size={14} />
                </span>
              </div>
            </button>
            {/* 모바일 전용: 버튼 영역 밖 가격·변동 표시 */}
            <span className={styles.mobilePriceMain} data-positive={dataPositive}>
              {priceFormatter.formatPrice(tradePrice)}
            </span>
            <span className={styles.mobilePriceSub} data-positive={dataPositive}>
              {changeParts.sign}
              {changeParts.numeric} ({formatChangeRate(changeRate)}%)
            </span>
          </div>

          {/* 구분선 */}
          <div className={styles.barDivider} />

          {/* 스크롤 가능한 가격·통계 영역 */}
          <div className={styles.infoScrollArea}>
            {/* 현재가 */}
            <div className={styles.priceBlock}>
              <span className={styles.priceMain} data-positive={dataPositive}>
                {priceFormatter.formatPrice(tradePrice)}
              </span>
              <span className={styles.priceSub} data-positive={dataPositive}>
                {changeParts.sign}
                {changeParts.numeric} ({formatChangeRate(changeRate)}%)
              </span>
            </div>

            <div className={styles.statItem}>
              <span className={styles.statLabel}>전일종가</span>
              <span className={styles.statValue}>
                {priceFormatter.formatPrice(prevClosingPrice)}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>고가</span>
              <span className={styles.statValue}>
                {priceFormatter.formatPrice(highPrice)}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>저가</span>
              <span className={styles.statValue}>
                {priceFormatter.formatPrice(lowPrice)}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>24h 거래량</span>
              <span className={styles.statValue}>
                {volumeFormatter.formatVolume(accTradeVolume24h)} {assetSymbol}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>24h 거래대금</span>
              <span className={styles.statValue}>
                {accTradeAmountFmt.numeric}
                {accTradeAmountFmt.unit}
              </span>
            </div>
          </div>

          {/* 즐겨찾기 (맨 오른쪽) */}
          <button
            className={styles.favoriteBtn}
            onClick={() => {
              if (!user) {
                router.push('/login');
                return;
              }

              const prev = isFavorite;
              setIsFavorite(!prev);
              tickerStore.toggleWatchlist(code);

              toggleFavorite(code).catch(() => {
                setIsFavorite(prev);
                tickerStore.toggleWatchlist(code);
              });
            }}
            aria-label="즐겨찾기"
            data-active={isFavorite}
          >
            <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Mobile Tab Bar */}
        <div className={styles.mobileTabBar}>
          {(['chart', 'orderbook', 'trades', 'order'] as Tab[]).map((t) => (
            <button
              key={t}
              className={styles.mobileTabBtn}
              data-active={tab === t}
              onClick={() => setTab(t)}
            >
              {t === 'chart'
                ? '차트'
                : t === 'orderbook'
                  ? '호가'
                  : t === 'trades'
                    ? '체결'
                    : '주문내역'}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className={styles.mainContent}>
          {/* Content Grid */}
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
                  <div className={styles.historyTabBar}>
                    <button
                      className={styles.historyTabBtn}
                      data-active={historyTab === 'pending'}
                      onClick={() => setHistoryTab('pending')}
                    >
                      미체결 주문
                    </button>
                    <button
                      className={styles.historyTabBtn}
                      data-active={historyTab === 'completed'}
                      onClick={() => setHistoryTab('completed')}
                    >
                      체결 내역
                    </button>
                  </div>
                  <div className={styles.historyContent}>
                    {user ? (
                      <>
                        <div
                          data-active={historyTab === 'pending'}
                          className={styles.historySection}
                        >
                          <div className={styles.mobileSectionLabel}>미체결 주문</div>
                          <NewPendingOrderList />
                        </div>
                        <div
                          data-active={historyTab === 'completed'}
                          className={styles.historySection}
                        >
                          <div className={styles.mobileSectionLabel}>체결 내역</div>
                          <NewCompletedOrderList />
                        </div>
                      </>
                    ) : (
                      <div className={styles.loginPrompt}>
                        <span className={styles.loginPromptText}>
                          주문 내역을 보려면
                          <br />
                          로그인이 필요해요
                        </span>
                        <a href="/login" className={styles.loginPromptBtn}>
                          로그인하기
                        </a>
                      </div>
                    )}
                  </div>
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
              <OrderForm code={code} hideHistory authenticated={!!user} />
            </div>
          </div>
        </div>
        {/* end mainContent */}

        {/* CoinList Panel */}
        {coinListOpen && <MarketCoinListPanel onClose={() => setCoinListOpen(false)} />}

        {/* Mobile QuickOrderBar */}
        <div className={styles.quickOrderBar}>
          <button
            className={styles.buyBtn}
            onClick={() => {
              orderFormStore.setSide('BUY');
              setMobileOrderSheetOpen(true);
            }}
          >
            매수
          </button>
          <button
            className={styles.sellBtn}
            onClick={() => {
              orderFormStore.setSide('SELL');
              setMobileOrderSheetOpen(true);
            }}
          >
            매도
          </button>
        </div>

        {/* Mobile Order Form Bottom Sheet */}
        {mobileOrderSheetOpen && (
          <MobileOrderFormSheet
            code={code}
            authenticated={!!user}
            onClose={() => setMobileOrderSheetOpen(false)}
          />
        )}
      </div>
    </AuthenticatedContext.Provider>
  );
};

export default TestMarketPageClient;
