'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  useTicker,
  useTickerStore,
  useTickerListView,
  useVisibleTickerCodes,
} from '@/hooks/uses/tickers.hooks';
import { useIsAuthenticated } from '@/utils/context/auth.context';
import { createKrwPriceFormatter } from '@/utils/formatting/price';
import { formatChangeRate } from '@/utils/formatting/changeRate';
import { toggleFavorite } from '@/utils/api/favorites.api';
import { useDragToDismiss } from '@/hooks/uses/useDragToDismiss';
import { useAllPositions } from '@/utils/stores/positions.store';
import type {
  FilterMode,
  SortKey,
  SortDir,
  HoldingSort,
  HoldingSortKey,
} from '@/types/view.types';
import styles from './styles/MarketCoinListPanel.module.css';

interface MarketCoinListPanelProps {
  onClose: () => void;
}

const TABS: { id: FilterMode; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'watchlist', label: '즐겨찾기' },
  { id: 'holding', label: '보유' },
];

const LOGIN_REQUIRED_FILTERS: FilterMode[] = ['watchlist', 'holding'];

/* ── 정렬 헤더 버튼 ── */
interface SortFieldProps {
  label: string;
  field: SortKey;
  currentSort: SortKey | null;
  currentDir: SortDir | null;
  onClick: () => void;
}

const SortField = ({
  label,
  field,
  currentSort,
  currentDir,
  onClick,
}: SortFieldProps) => {
  const isActive = currentSort === field;
  return (
    <button className={styles.sortField} onClick={onClick} type="button">
      <span className={styles.sortLabel} data-active={isActive}>
        {label}
      </span>
      <div
        className={styles.sortIcon}
        data-active={isActive}
        data-dir={isActive ? currentDir : undefined}
      >
        <svg width="10" height="10" viewBox="0 0 10 10">
          <path d="M5 0L9.33013 3.75H0.669871L5 0Z" className={styles.sortUp} />
          <path d="M5 10L0.669871 6.25H9.33013L5 10Z" className={styles.sortDown} />
        </svg>
      </div>
    </button>
  );
};

/* ── 보유 탭 정렬 헤더 버튼 ── */
interface HoldingSortFieldProps {
  label: string;
  field: HoldingSortKey;
  currentSort: HoldingSortKey;
  currentDir: SortDir;
  onClick: () => void;
}

const HoldingSortField = ({
  label,
  field,
  currentSort,
  currentDir,
  onClick,
}: HoldingSortFieldProps) => {
  const isActive = currentSort === field;
  return (
    <button className={styles.sortField} onClick={onClick} type="button">
      <span className={styles.sortLabel} data-active={isActive}>
        {label}
      </span>
      <div
        className={styles.sortIcon}
        data-active={isActive}
        data-dir={isActive ? currentDir : undefined}
      >
        <svg width="10" height="10" viewBox="0 0 10 10">
          <path d="M5 0L9.33013 3.75H0.669871L5 0Z" className={styles.sortUp} />
          <path d="M5 10L0.669871 6.25H9.33013L5 10Z" className={styles.sortDown} />
        </svg>
      </div>
    </button>
  );
};

function formatQtyForPanel(qty: number): string {
  if (qty === 0) return '0개';
  if (Number.isInteger(qty)) return `${qty.toLocaleString('ko-KR')}개`;
  const str = qty.toPrecision(6).replace(/\.?0+$/, '');
  return `${str}개`;
}

/* ── 보유 탭 코인 행 ── */
const PanelHoldingRow = ({ code, onClose }: { code: string; onClose: () => void }) => {
  const ticker = useTicker(code);
  const store = useTickerStore();
  const allPositions = useAllPositions();
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();

  const position = allPositions.get(code) ?? null;

  if (!ticker || !position) return null;

  const qty = Number(position.qty);
  const avgPrice = Number(position.avgPrice);
  const cost = Number(position.cost);
  const evalAmount = ticker.tradePrice * qty;
  const profit = (ticker.tradePrice - avgPrice) * qty;
  const profitRate = cost > 0 ? profit / cost : 0;

  const evalFormatter = createKrwPriceFormatter(evalAmount);
  const evalAmountStr = evalFormatter.formatPrice(evalAmount);
  const profitRateStr = formatChangeRate(Math.abs(profitRate));

  const isRise = profit > 0;
  const isFall = profit < 0;
  const profitSign = isRise ? '+' : isFall ? '-' : '';
  const profitClass = isRise
    ? styles.holdingRise
    : isFall
      ? styles.holdingFall
      : styles.holdingEven;

  const isWatchlisted = store.hasWatchlist(code);
  const imgSrc = `https://api.chartraders.club/markets/icon/${ticker.code.replace('KRW-', '').toUpperCase()}`;

  const handleStar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    store.toggleWatchlist(code);
    toggleFavorite(code).catch(() => store.toggleWatchlist(code));
  };

  return (
    <Link
      href={`/test/market/${code}`}
      prefetch={false}
      className={styles.holdingRow}
      onClick={onClose}
    >
      <div className={styles.coinNameCell}>
        <button
          className={styles.coinStarBtn}
          onClick={handleStar}
          type="button"
          aria-label="즐겨찾기"
        >
          <Star
            size={14}
            fill={isWatchlisted ? 'var(--yellow)' : 'none'}
            stroke={isWatchlisted ? 'var(--yellow)' : 'var(--grey500)'}
            strokeWidth={1.5}
          />
        </button>
        <div className={styles.coinIconWrap}>
          <Image src={imgSrc} alt={ticker.code} width={18} height={18} />
        </div>
        <div className={styles.coinNameWrap}>
          <span className={styles.coinKorName}>{ticker.koreanName}</span>
          <span className={styles.holdingQty}>{formatQtyForPanel(qty)}</span>
        </div>
      </div>
      <div className={styles.holdingEvalCell}>
        <span className={styles.holdingEvalAmount}>{evalAmountStr}원</span>
      </div>
      <div className={styles.holdingProfitRateCell}>
        <span className={`${styles.holdingProfitRate} ${profitClass}`}>
          {profitSign}
          {profitRateStr}%
        </span>
      </div>
    </Link>
  );
};

/* ── 보유 섹션 (정렬 포함) ── */
const PanelHoldingSection = ({ onClose }: { onClose: () => void }) => {
  const [sort, setSort] = useState<HoldingSort>({ key: 'evalAmount', dir: 'desc' });
  const allPositions = useAllPositions();
  const store = useTickerStore();
  const listView = useTickerListView();

  const toggleSort = (key: HoldingSortKey) => {
    setSort((prev) => ({
      key,
      dir: prev.key === key ? (prev.dir === 'desc' ? 'asc' : 'desc') : 'desc',
    }));
  };

  // TickerStore.holding 셋에 의존하지 않고 positionsStore에서 직접 코드 추출
  const holdingCodes = useMemo(() => {
    const q = listView.query.trim().toLowerCase();
    return Array.from(allPositions.keys()).filter((code) => {
      if (!q) return true;
      const ticker = store.getTicker(code);
      if (!ticker) return false;
      const tickerCode = code.replace('KRW-', '').toLowerCase();
      const kr = (ticker.koreanName ?? '').toLowerCase();
      return tickerCode.includes(q) || kr.includes(q);
    });
  }, [allPositions, listView.query, store]);

  const sortedCodes = useMemo(() => {
    const mul = sort.dir === 'asc' ? 1 : -1;
    return [...holdingCodes].sort((a, b) => {
      if (sort.key === 'name') {
        const nameA = store.getTicker(a)?.koreanName ?? '';
        const nameB = store.getTicker(b)?.koreanName ?? '';
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
      return 0;
    });
  }, [holdingCodes, sort, allPositions, store]);

  return (
    <>
      <div className={styles.holdingListHeader}>
        <HoldingSortField
          label="이름"
          field="name"
          currentSort={sort.key}
          currentDir={sort.dir}
          onClick={() => toggleSort('name')}
        />
        <HoldingSortField
          label="평가금액"
          field="evalAmount"
          currentSort={sort.key}
          currentDir={sort.dir}
          onClick={() => toggleSort('evalAmount')}
        />
        <HoldingSortField
          label="수익률"
          field="profitRate"
          currentSort={sort.key}
          currentDir={sort.dir}
          onClick={() => toggleSort('profitRate')}
        />
      </div>
      <div className={styles.rowsContainer}>
        {sortedCodes.map((code) => (
          <PanelHoldingRow key={code} code={code} onClose={onClose} />
        ))}
      </div>
    </>
  );
};

/* ── 패널 전용 코인 행 ── */
const PanelCoinRow = ({ code, onClose }: { code: string; onClose: () => void }) => {
  const ticker = useTicker(code);
  const store = useTickerStore();
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();

  if (!ticker) return null;

  const priceFormatter = createKrwPriceFormatter(ticker.tradePrice);
  const price = priceFormatter.formatPrice(ticker.tradePrice);
  const change = priceFormatter.formatDiffParts(ticker.signedChangePrice);
  const isWatchlisted = store.hasWatchlist(code);
  const imgSrc = `https://api.chartraders.club/markets/icon/${ticker.code.replace('KRW-', '').toUpperCase()}`;

  const handleStar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    store.toggleWatchlist(code);
    toggleFavorite(code).catch(() => store.toggleWatchlist(code));
  };

  const changeClass =
    ticker.change === 'RISE'
      ? styles.coinRise
      : ticker.change === 'FALL'
        ? styles.coinFall
        : styles.coinEven;

  return (
    <Link
      href={`/test/market/${code}`}
      prefetch={false}
      className={styles.coinRow}
      onClick={onClose}
    >
      <div className={styles.coinNameCell}>
        <button
          className={styles.coinStarBtn}
          onClick={handleStar}
          type="button"
          aria-label="즐겨찾기"
        >
          <Star
            size={14}
            fill={isWatchlisted ? 'var(--yellow)' : 'none'}
            stroke={isWatchlisted ? 'var(--yellow)' : 'var(--grey500)'}
            strokeWidth={1.5}
          />
        </button>
        <div className={styles.coinIconWrap}>
          <Image src={imgSrc} alt={ticker.code} width={18} height={18} />
        </div>
        <div className={styles.coinNameWrap}>
          <span className={styles.coinKorName}>{ticker.koreanName}</span>
          <span className={styles.coinCode}>{ticker.code.replace('KRW-', '')}</span>
        </div>
      </div>
      <div className={styles.coinPriceCell}>
        <span className={styles.coinPrice}>{price}원</span>
      </div>
      <div className={styles.coinChangeCell}>
        <span className={`${styles.coinChangeRate} ${changeClass}`}>
          {change.sign}
          {formatChangeRate(ticker.changeRate)}%
        </span>
      </div>
    </Link>
  );
};

/* ── 패널 본체 ── */
const MarketCoinListPanel = ({ onClose }: MarketCoinListPanelProps) => {
  const store = useTickerStore();
  const listView = useTickerListView();
  const visibleCodes = useVisibleTickerCodes();
  const isAuthenticated = useIsAuthenticated();
  const searchRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const { handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseDown } =
    useDragToDismiss(sheetRef, onClose, { mobileOnly: true });

  // body scroll lock
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // 패널 닫힐 때 검색어 초기화
  useEffect(() => {
    return () => {
      store.setQuery('');
    };
  }, [store]);

  // 열리면 검색창 포커스
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const showLoginPrompt =
    !isAuthenticated && LOGIN_REQUIRED_FILTERS.includes(listView.filter);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div ref={sheetRef} className={styles.panel} onClick={(e) => e.stopPropagation()}>
        {/* 드래그 핸들 (모바일 전용) */}
        <div
          className={styles.handle}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'none', userSelect: 'none' }}
        />

        {/* 검색 */}
        <div className={styles.searchBox}>
          <button
            className={styles.backBtn}
            onClick={onClose}
            type="button"
            aria-label="닫기"
          >
            <ArrowLeft size={20} />
          </button>
          <input
            ref={searchRef}
            className={styles.searchInput}
            type="text"
            placeholder="코인 검색"
            value={listView.query}
            onChange={(e) => store.setQuery(e.target.value)}
          />
        </div>

        {/* 탭 */}
        <div className={styles.tabsBar}>
          {TABS.map((tab) => {
            const isActive = listView.filter === tab.id;
            return (
              <button
                key={tab.id}
                className={styles.tabBtn}
                data-active={isActive}
                onClick={() => store.setFilter(tab.id)}
                type="button"
              >
                <span className={styles.tabLabel}>{tab.label}</span>
                {isActive && <div className={styles.tabPill} />}
              </button>
            );
          })}
        </div>

        {/* 스크롤 영역 */}
        <div className={styles.listScroll}>
          {showLoginPrompt ? (
            <div className={styles.loginPrompt}>
              <span className={styles.loginPromptText}>
                {listView.filter === 'watchlist' ? (
                  <>
                    즐겨찾기를 보려면
                    <br />
                    로그인이 필요해요
                  </>
                ) : (
                  <>
                    보유 자산을 보려면
                    <br />
                    로그인이 필요해요
                  </>
                )}
              </span>
              <a href="/login" className={styles.loginPromptBtn}>
                로그인하기
              </a>
            </div>
          ) : listView.filter === 'holding' ? (
            <PanelHoldingSection onClose={onClose} />
          ) : (
            <>
              <div className={styles.listHeader}>
                <SortField
                  label="이름"
                  field="name"
                  currentSort={listView.sortKey}
                  currentDir={listView.dir}
                  onClick={() => store.setSort('name')}
                />
                <SortField
                  label="현재가"
                  field="price"
                  currentSort={listView.sortKey}
                  currentDir={listView.dir}
                  onClick={() => store.setSort('price')}
                />
                <SortField
                  label="등락률"
                  field="changeRate"
                  currentSort={listView.sortKey}
                  currentDir={listView.dir}
                  onClick={() => store.setSort('changeRate')}
                />
              </div>
              <div className={styles.rowsContainer}>
                {visibleCodes.map((code) => (
                  <PanelCoinRow key={code} code={code} onClose={onClose} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketCoinListPanel;
