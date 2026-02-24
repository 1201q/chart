'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { ChevronDown, Star } from 'lucide-react';
import MainPageHeader from '@/components/mainPage/MainPageHeader';
import styles from './styles/test.market.module.css';
import { AuthUser } from '@/utils/api/auth.api';
import { useTickerSelector2 } from '@/hooks/uses/tickers.hooks';
import { createKrwPriceFormatter } from '@/utils/formatting/price';
import { createKrwVolumeFormatter } from '@/utils/formatting/volume';
import { formatAccTradePriceKRW } from '@/utils/formatting/accTradePriceKRW';
import { formatChangeRate } from '@/utils/formatting/changeRate';
import MarketChartV2 from '@/components/chart/new/NewMarketChartV2';
import NewMarketTrade from '@/components/tradeList/new/NewMarketTrade';

type Tab = 'chart' | 'orderbook' | 'trades' | 'order';
type InnerTab = 'orderbook' | 'trades';
type HistoryTab = 'pending' | 'completed';

interface TestMarketPageClientProps {
  user: AuthUser | null;
  code: string;
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

const TestMarketPageClient = ({ user, code }: TestMarketPageClientProps) => {
  const [tab, setTab] = useState<Tab>('chart');
  const [innerTab, setInnerTab] = useState<InnerTab>('trades');
  const [historyTab, setHistoryTab] = useState<HistoryTab>('pending');
  const [coinListOpen, setCoinListOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

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

  const iconSrc = `${process.env.NEXT_PUBLIC_API_URL}/markets/icon/${assetSymbol.toUpperCase()}`;

  return (
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
          onClick={() => setIsFavorite((prev) => !prev)}
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
                  : '주문'}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Content Grid */}
        <div className={styles.contentGrid}>
          {/* Chart Column */}
          <div className={styles.chartColumn}>
            <MarketChartV2 code={code} />
          </div>

          {/* Orderbook / Trades Column */}
          <div className={styles.orderbookTradesColumn}>
            {/* PC inner tab */}
            <div className={styles.innerTabBar}>
              <button
                className={styles.innerTabBtn}
                data-active={innerTab === 'orderbook'}
                onClick={() => setInnerTab('orderbook')}
              >
                호가
              </button>
              <button
                className={styles.innerTabBtn}
                data-active={innerTab === 'trades'}
                onClick={() => setInnerTab('trades')}
              >
                체결
              </button>
            </div>
            <div className={styles.innerTabContent} data-inner-tab={innerTab}>
              <div className={styles.innerPane} data-pane="orderbook">
                <div className={styles.placeholder}>호가 (Orderbook)</div>
              </div>
              <div className={styles.innerPane} data-pane="trades">
                <NewMarketTrade />
              </div>
            </div>
          </div>

          {/* OrderForm Column */}
          <div className={styles.orderFormColumn}>
            <div className={styles.placeholder}>오더폼 (OrderForm)</div>
          </div>
        </div>

        {/* OrderHistory (PC: 4컬럼 아래 전체 너비) */}
        <div className={styles.orderHistory}>
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
            {historyTab === 'pending' ? (
              <div className={styles.placeholder}>미체결 주문 목록</div>
            ) : (
              <div className={styles.placeholder}>체결 내역 목록</div>
            )}
          </div>
        </div>
      </div>
      {/* end mainContent */}

      {/* Mobile QuickOrderBar */}
      <div className={styles.quickOrderBar}>
        <button className={styles.buyBtn}>매수</button>
        <button className={styles.sellBtn}>매도</button>
      </div>
    </div>
  );
};

export default TestMarketPageClient;
