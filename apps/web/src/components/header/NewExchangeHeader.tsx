'use client';

import styles from './styles/exchange.header.module.css';
import { createKrwPriceFormatter } from '@/utils/formatting/price';
import { formatChangeRate } from '@/utils/formatting/changeRate';
import { ChevronDown } from 'lucide-react';
import { Activity, useEffect, useMemo, useState } from 'react';

import { Tab } from '@/types/tabs.types';
import { useTicker } from '@/hooks/uses/tickers.hooks';
import NewTickerListModal from '../coinList/NewTickerListModal';

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
const NewExchangeHeader = ({ code, selectedTab }: { code: string; selectedTab: Tab }) => {
  const ticker = useTicker(code);

  const [listOpen, setListOpen] = useState(false);

  const isMobile = useMediaQuery('(max-width: 1000px)');
  const [visiblePriceOnScroll, setVisiblePriceOnScroll] = useState(false);

  useEffect(() => {
    // pc만 스크롤을 감지함.
    if (isMobile) return;

    const onScroll = () => {
      setVisiblePriceOnScroll(window.scrollY >= 60);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isMobile]);

  // pc - 스크롤 내려가면
  // 모바일 - 차트 탭이 아닐때
  const showPrice = useMemo(() => {
    if (isMobile) return selectedTab !== 'chart';
    return visiblePriceOnScroll;
  }, [isMobile, selectedTab, visiblePriceOnScroll]);

  if (!ticker) return <SkeletonHeader />;

  const priceFormatter = createKrwPriceFormatter(ticker.tradePrice);
  const change = priceFormatter.formatDiffParts(ticker.signedChangePrice);

  return (
    <div className={styles.exchangeHeader}>
      <button
        className={`${styles.coinNameButton} ${listOpen ? styles.open : ''}`}
        onClick={() => setListOpen((prev) => !prev)}
      >
        <span className={styles.koreanNameText}>{ticker.koreanName}</span>
        <span className={styles.codeText}>{code.replace('KRW-', '')}</span>
        <ChevronDown />
      </button>
      <Activity mode={listOpen ? 'visible' : 'hidden'}>
        <NewTickerListModal close={() => setListOpen(false)} />
      </Activity>
      <div
        aria-hidden={!showPrice}
        className={`${styles.textWrapper} ${!showPrice ? styles.hidden : ''}`}
      >
        <h2 className={styles.coinPriceText}>
          {priceFormatter.formatPrice(ticker.tradePrice)}원
        </h2>
        <div className={styles.changeWrapper}>
          <span
            className={`${styles.changeRumericText} ${ticker.change === 'RISE' ? styles.rise : ticker.change === 'FALL' ? styles.fall : styles.even}`}
          >
            {change.sign}
            {change.numeric} ({formatChangeRate(ticker.changeRate)}
            %)
          </span>
        </div>
      </div>
    </div>
  );
};

const SkeletonHeader = () => {
  return (
    <div className={styles.exchangeHeader}>
      <div className={`sk ${styles.skeleton} ${styles.coinNameButton}`}></div>
      <div className={`${styles.textWrapper} ${styles.hidden}`}>
        <h2 className={`sk ${styles.skeleton} ${styles.coinPriceText}`}></h2>
        <div className={styles.changeWrapper}>
          <span className={`sk ${styles.skeleton} ${styles.changeRumericText}`}></span>
        </div>
      </div>
    </div>
  );
};

export default NewExchangeHeader;
