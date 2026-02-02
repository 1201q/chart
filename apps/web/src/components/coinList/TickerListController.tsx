'use client';

import { useTickerListView, useTickerStore } from '@/hooks/uses/tickers.hooks';
import styles from './styles/ticker.controller.module.css';
import { SortKey, TickerListView } from '@/types/view.types';
import { useEffect, useRef, useState } from 'react';
import { SearchIcon, XIcon } from 'lucide-react';

const TickerListController = () => {
  const store = useTickerStore();
  const tickerListView = useTickerListView();

  return (
    <div className={styles.listController}>
      {/* 접히는 영역 */}

      <div className={styles.listTitleWrapper}>
        <SearchBox />
      </div>
      <MenuButtons />

      {/* sticky 헤더 */}

      <div className={styles.listHeader}>
        <div className={styles.listHeaderLeftWrapper}>
          <SortField
            label="자산명"
            k={'name'}
            sort={tickerListView['uiSort']}
            onClick={() => store.setSort('name')}
          />
        </div>
        <div className={styles.listHeaderRightWrapper}>
          <div className={styles.textWrapper}>
            <SortField
              label="현재가"
              k={'price'}
              sort={tickerListView['uiSort']}
              onClick={() => store.setSort('price')}
            />
            <SortField
              label="거대래금"
              k={'acc'}
              sort={tickerListView['uiSort']}
              onClick={() => store.setSort('acc')}
              iconVisible={false}
            />
          </div>
          <div className={styles.priceWrapper}>
            <SortField
              label="변동률"
              k={'changeRate'}
              sort={tickerListView['uiSort']}
              onClick={() => store.setSort('changeRate')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const SortField = ({
  label,
  k,
  sort,
  onClick,
  iconVisible = true,
}: {
  label: string;
  k: SortKey;
  sort: TickerListView['uiSort'];
  onClick: () => void;
  iconVisible?: boolean;
}) => {
  const active = sort?.key === k;
  const dir = sort?.dir;

  return (
    <button
      className={`${styles.sortField} ${!iconVisible ? styles.iconVisible : ''}`}
      data-active={active}
      onClick={onClick}
    >
      <span className={styles.sortLabel} data-active={active}>
        {label}
      </span>
      {iconVisible && (
        <div className={styles.sortIcon} data-active={active} data-dir={dir}>
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={styles.sortSvg}
          >
            <path d="M5 0L9.33013 3.75H0.669871L5 0Z" className={styles.sortUp} />
            <path d="M5 10L0.669871 6.25H9.33013L5 10Z" className={styles.sortDown} />
          </svg>
        </div>
      )}
    </button>
  );
};

const MenuButtons = () => {
  const store = useTickerStore();
  const tickerListView = useTickerListView();

  return (
    <div className={styles.menuButtons}>
      <button
        onClick={() => store.setFilter('all')}
        className={styles.menuButton}
        data-active={tickerListView.filter === 'all'}
      >
        <span>전체</span>
      </button>
      <button
        onClick={() => store.setFilter('watchlist')}
        className={styles.menuButton}
        data-active={tickerListView.filter === 'watchlist'}
      >
        <span>관심</span>
      </button>
      <button
        onClick={() => store.setFilter('holding')}
        className={styles.menuButton}
        data-active={tickerListView.filter === 'holding'}
      >
        <span>보유</span>
      </button>
    </div>
  );
};

const SearchBox = () => {
  const store = useTickerStore();
  const tickerListView = useTickerListView();

  const [local, setLocal] = useState(tickerListView.query ?? '');
  const composingRef = useRef(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!composingRef.current) setLocal(tickerListView.query ?? '');
  }, [tickerListView.query]);

  const commit = (next: string) => {
    setLocal(next);
    store.setQuery(next);
  };

  return (
    <div className={styles.searchBox}>
      <form
        className={styles.inputBox}
        onSubmit={(e) => e.preventDefault()}
        onReset={(e) => {
          e.preventDefault();
          commit('');
        }}
      >
        <SearchIcon
          size={14}
          strokeWidth={2.5}
          color="var(--grey500)"
          style={{ marginTop: '0px' }}
        />
        <input
          type="text"
          spellCheck={false}
          maxLength={16}
          placeholder="검색어를 입력하세요"
          value={local}
          onCompositionStart={() => {
            composingRef.current = true;
          }}
          onCompositionEnd={(e) => {
            composingRef.current = false;
            // 조합이 끝난최종 문자열만 store에 반영
            commit(e.currentTarget.value);
          }}
          onChange={(e) => {
            const next = e.target.value;
            setLocal(next);

            // 조합 중에는 store 업데이트 금지 (한글 중복 입력 방지!!)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((e.nativeEvent as any).isComposing || composingRef.current) return;

            store.setQuery(next);
          }}
        />

        <button className={styles.resetButton} type="reset">
          <XIcon
            size={9}
            strokeWidth={3.5}
            strokeLinecap="round"
            color="var(--grey100)"
          />
        </button>
      </form>
    </div>
  );
};

export default TickerListController;
