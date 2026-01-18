'use client';

import styles from './styles/exchange.header.module.css';
import { createKrwPriceFormatter } from '@/utils/formatting/price';
import { formatChangeRate } from '@/utils/formatting/changeRate';
import { ChevronDown } from 'lucide-react';
import { Activity, useEffect, useMemo, useState } from 'react';

import { Tab } from '@/types/tabs.types';
import { useTickerSelector2 } from '@/hooks/uses/tickers.hooks';
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
  const koreanName = useTickerSelector2(code, (ticker) => ticker?.koreanName ?? '');

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

  return (
    <div className={styles.exchangeHeader}>
      <button
        className={`${styles.coinNameButton} ${listOpen ? styles.open : ''}`}
        onClick={() => setListOpen((prev) => !prev)}
      >
        <span className={styles.koreanNameText}>{koreanName}</span>
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
        <ChangeInfo code={code} />
      </div>
    </div>
  );
};

const ChangeInfo = ({ code }: { code: string }) => {
  const tradePrice = useTickerSelector2(code, (ticker) => ticker?.tradePrice ?? 0);
  const signedChangePrice = useTickerSelector2(
    code,
    (ticker) => ticker?.signedChangePrice ?? 0,
  );
  const changeRate = useTickerSelector2(code, (ticker) => ticker?.changeRate ?? 0);
  const change = useTickerSelector2(code, (ticker) => ticker?.change ?? 'EVEN');

  const priceFormatter = createKrwPriceFormatter(tradePrice);
  const changeParts = priceFormatter.formatDiffParts(signedChangePrice);

  return (
    <>
      <h2 className={styles.coinPriceText}>{priceFormatter.formatPrice(tradePrice)}원</h2>
      <div className={styles.changeWrapper}>
        <span
          className={`${styles.changeRumericText} ${change === 'RISE' ? styles.rise : change === 'FALL' ? styles.fall : styles.even}`}
        >
          {changeParts.sign}
          {changeParts.numeric} ({formatChangeRate(changeRate)}
          %)
        </span>
      </div>
    </>
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
