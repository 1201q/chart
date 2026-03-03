'use client';

import { useEffect, useRef } from 'react';
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
import type { FilterMode, SortKey, SortDir } from '@/types/view.types';
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

const SortField = ({ label, field, currentSort, currentDir, onClick }: SortFieldProps) => {
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

  const { handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseDown } = useDragToDismiss(
    sheetRef,
    onClose,
    { mobileOnly: true },
  );

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
