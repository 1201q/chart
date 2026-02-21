'use client';

import { useState } from 'react';
import MainPageHeader from '@/components/mainPage/MainPageHeader';
import styles from './styles/test.market.module.css';

type Tab = 'chart' | 'orderbook' | 'trades' | 'order';
type InnerTab = 'orderbook' | 'trades';
type HistoryTab = 'pending' | 'completed';

const TestMarketPageClient = () => {
  const [tab, setTab] = useState<Tab>('chart');
  const [innerTab, setInnerTab] = useState<InnerTab>('orderbook');
  const [historyTab, setHistoryTab] = useState<HistoryTab>('pending');

  return (
    <div className={styles.page} data-tab={tab}>
      {/* Header */}
      <MainPageHeader />

      {/* CoinInfoBar */}
      <div className={styles.coinInfoBar}>
        <span className={styles.coinName}>BTC/KRW</span>
        <span className={styles.coinPrice}>43,200,000</span>
        <span className={styles.coinChange} data-positive="true">
          +2.34%
        </span>
        <span className={styles.coinStat}>
          <em>고</em> 43,500,000
        </span>
        <span className={styles.coinStat}>
          <em>저</em> 42,100,000
        </span>
        <span className={styles.coinStat}>
          <em>거래량</em> 1,234 BTC
        </span>
        <span className={styles.coinStat}>
          <em>거래대금</em> 53.2억
        </span>
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
            <div className={styles.placeholder}>차트 영역</div>
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
                <div className={styles.placeholder}>체결 (Trades)</div>
              </div>
            </div>
            {/* Mobile: tab별로 content 전환은 data-tab으로 처리 */}
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
