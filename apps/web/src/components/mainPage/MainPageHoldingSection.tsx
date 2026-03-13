'use client';

import { useMemo } from 'react';
import { useVisibleTickerCodes, useTickerStore } from '@/hooks/uses/tickers.hooks';
import { useAllPositions } from '@/utils/stores/positions.store';
import MainPageHoldingListHeader from './MainPageHoldingListHeader';
import MainPageHoldingRow from './MainPageHoldingRow';
import styles from './MainPageCoinList.module.css';
import type { HoldingSort, HoldingSortKey, SortDir } from '@/types/view.types';

interface MainPageHoldingSectionProps {
  sort: HoldingSort;
  onSortChange: (key: HoldingSortKey) => void;
  onSortExplicit: (key: HoldingSortKey, dir: SortDir) => void;
}

const MainPageHoldingSection = ({
  sort,
  onSortChange,
  onSortExplicit,
}: MainPageHoldingSectionProps) => {
  const codes = useVisibleTickerCodes();
  const allPositions = useAllPositions();
  const store = useTickerStore();

  const sortedCodes = useMemo(() => {
    const mul = sort.dir === 'asc' ? 1 : -1;

    return [...codes].sort((a, b) => {
      if (sort.key === 'name') {
        const tickerA = store.getTicker(a);
        const tickerB = store.getTicker(b);
        const nameA = tickerA?.koreanName ?? '';
        const nameB = tickerB?.koreanName ?? '';
        return nameA.localeCompare(nameB, 'ko-KR') * mul;
      }

      const posA = allPositions.get(a);
      const posB = allPositions.get(b);
      const tickerA = store.getTicker(a);
      const tickerB = store.getTicker(b);

      if (!posA || !posB || !tickerA || !tickerB) return 0;

      const qtyA = Number(posA.qty);
      const qtyB = Number(posB.qty);
      const costA = Number(posA.cost);
      const costB = Number(posB.cost);

      if (sort.key === 'evalAmount') {
        const evalA = tickerA.tradePrice * qtyA;
        const evalB = tickerB.tradePrice * qtyB;
        return (evalA === evalB ? 0 : evalA > evalB ? 1 : -1) * mul;
      }

      if (sort.key === 'profitRate') {
        const avgA = Number(posA.avgPrice);
        const avgB = Number(posB.avgPrice);
        const profitA = (tickerA.tradePrice - avgA) * qtyA;
        const profitB = (tickerB.tradePrice - avgB) * qtyB;
        const rateA = costA > 0 ? profitA / costA : 0;
        const rateB = costB > 0 ? profitB / costB : 0;
        return (rateA === rateB ? 0 : rateA > rateB ? 1 : -1) * mul;
      }

      if (sort.key === 'profit') {
        const avgA = Number(posA.avgPrice);
        const avgB = Number(posB.avgPrice);
        const profitA = (tickerA.tradePrice - avgA) * qtyA;
        const profitB = (tickerB.tradePrice - avgB) * qtyB;
        return (profitA === profitB ? 0 : profitA > profitB ? 1 : -1) * mul;
      }

      return 0;
    });
  }, [codes, allPositions, sort, store]);

  if (sortedCodes.length === 0) {
    return (
      <div className={styles.loginPrompt}>
        <span className={styles.loginPromptText}>보유 중인 코인이 없습니다</span>
      </div>
    );
  }

  return (
    <>
      <MainPageHoldingListHeader
        sort={sort}
        onSortChange={onSortChange}
        onSortExplicit={onSortExplicit}
      />
      <div className={styles.rowsContainer}>
        {sortedCodes.map((code) => (
          <MainPageHoldingRow key={code} code={code} />
        ))}
      </div>
    </>
  );
};

export default MainPageHoldingSection;
