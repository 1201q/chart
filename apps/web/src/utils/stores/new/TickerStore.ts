import {
  MarketTickerWithNames,
  MarketTickerWithNamesMap,
  MarketTicker,
} from '@chart/shared-types';
import { ExternalStoreBase } from '../_base/ExternalStoreBase';
import { KeyedExternalStoreBase } from '../_base/KeyedExternalStoreBase';
import {
  DEFAULT_COIN_LIST_VIEW,
  FilterMode,
  SortDir,
  SortKey,
  TickerListView,
} from '@/types/view.types';

type Listener = () => void;
type TickerKey = string | '__list__';

class ListBus extends ExternalStoreBase {
  notifyListeners() {
    this.notify();
  }
}

export class TickerStore2 extends KeyedExternalStoreBase<string> {
  private tickers = new Map<string, MarketTickerWithNames>();

  private cachedAll: MarketTickerWithNames[] = [];
  private dirty = true;

  private cachedCodes: string[] = [];
  private codesDirty = true;

  private listBus = new ListBus();

  constructor(initialSnapshot: MarketTickerWithNamesMap) {
    super();
    this.hydrate(initialSnapshot);
  }

  private hydrate(initialSnapshot: MarketTickerWithNamesMap) {
    for (const [code, ticker] of Object.entries(initialSnapshot)) {
      this.tickers.set(code, ticker);
    }

    this.dirty = true;
    this.codesDirty = true;
  }

  subscribeList(listener: Listener) {
    return this.listBus.subscribe(listener);
  }

  upsertFromStream(ticker: MarketTicker) {
    const prev = this.tickers.get(ticker.code);
    if (!prev) return;

    // 이름 머지
    const merged: MarketTickerWithNames = {
      ...prev, // korean_name, english_name 유지
      ...ticker, // 그 외 새로운 데이터로 덮어쓰기
    };

    this.tickers.set(ticker.code, merged);

    this.dirty = true; // 캐시 다시 계산
    this.codesDirty = true;
    this.notifyKey(ticker.code);

    this.listBus.notifyListeners();
  }

  getTicker(code: string) {
    return this.tickers.get(code);
  }

  getAllSorted() {
    if (this.dirty) {
      this.cachedAll = Array.from(this.tickers.values()).sort(
        (a, b) => b.accTradePrice24h - a.accTradePrice24h,
      );
      this.dirty = false;
    }
    return this.cachedAll;
  }

  getSortedCodes(): string[] {
    if (this.codesDirty) {
      const codes = this.getAllSorted().map((t) => t.code);

      const prev = this.cachedCodes;
      const isChanged =
        codes.length !== prev.length || codes.some((code, i) => code !== prev[i]);

      if (isChanged) this.cachedCodes = codes;
      this.codesDirty = false;
    }

    return this.cachedCodes;
  }
}

export class TickerStore extends KeyedExternalStoreBase<TickerKey> {
  private tickers = new Map<string, MarketTickerWithNames>();

  // view용 필터용 set
  private holding = new Set<string>();
  private watchlist = new Set<string>();

  // view state
  private view: TickerListView = DEFAULT_COIN_LIST_VIEW;

  // 캐시
  private cachedCodes: string[] = [];
  private codesDirty = true;

  constructor(initialSnapshot: MarketTickerWithNamesMap) {
    super();
    this.hydrate(initialSnapshot);
  }

  private hydrate(initialSnapshot: MarketTickerWithNamesMap) {
    for (const [code, ticker] of Object.entries(initialSnapshot)) {
      this.tickers.set(code, ticker);
    }

    this.codesDirty = true;
  }

  // ==================
  // 구독
  // ==================
  subscribeList(listener: Listener) {
    return this.subscribeKey('__list__', listener);
  }

  // ==================
  // updates
  // ==================
  upsertFromStream(ticker: MarketTicker) {
    const prev = this.tickers.get(ticker.code);
    if (!prev) return;

    // 이름 머지
    const merged: MarketTickerWithNames = {
      ...prev, // korean_name, english_name 유지
      ...ticker, // 그 외 새로운 데이터로 덮어쓰기
    };
    this.tickers.set(ticker.code, merged);

    // item 업데이트
    this.notifyKey(ticker.code);

    // list 업데이트 / 정렬,필터
    this.codesDirty = true;
    this.notifyKey('__list__');
  }

  // ==================
  // set
  // ==================
  setHoldingCodes(codes: string[]) {
    this.holding = new Set(codes);
    this.codesDirty = true;
    this.notifyKey('__list__');
  }

  setWatchlistCodes(codes: string[]) {
    this.watchlist = new Set(codes);
    this.codesDirty = true;
    this.notifyKey('__list__');
  }

  hasWatchlist(code: string): boolean {
    return this.watchlist.has(code);
  }

  toggleWatchlist(code: string) {
    if (this.watchlist.has(code)) {
      this.watchlist.delete(code);
    } else {
      this.watchlist.add(code);
    }
    this.codesDirty = true;
    this.notifyKey('__list__');
    this.notifyKey(code); // 개별 아이템도 업데이트
  }

  setFilter(filter: FilterMode) {
    if (this.view.filter === filter) return;

    this.view = { ...this.view, filter };
    this.codesDirty = true;
    this.notifyKey('__list__');
  }

  setQuery(query: string) {
    if (this.view.query === query) return;
    this.view = { ...this.view, query };
    this.codesDirty = true;
    this.notifyKey('__list__');
  }

  // 정렬
  setSort(key: SortKey) {
    const v = this.view;

    // 1. 다른 키 클릭 => desc 시작
    if (v.sortKey !== key) {
      this.view = { ...v, sortKey: key, dir: 'desc', uiSort: { key, dir: 'desc' } };
      this.codesDirty = true;
      this.notifyKey('__list__');
      return;
    }

    // 2. 같은 키 클릭 => asc => 해제(default)
    if (v.uiSort?.key === key && v.uiSort.dir === 'desc') {
      this.view = { ...v, dir: 'asc', uiSort: { key, dir: 'asc' } };
    } else if (v.uiSort?.key === key && v.uiSort.dir === 'asc') {
      // default 정렬로
      this.view = {
        ...v,
        sortKey: DEFAULT_COIN_LIST_VIEW.sortKey,
        dir: DEFAULT_COIN_LIST_VIEW.dir,
        uiSort: DEFAULT_COIN_LIST_VIEW.uiSort,
      };
    } else {
      // uisort가 null인 상태에서 같은 키 클릭 시 desc
      this.view = { ...v, sortKey: key, dir: 'desc', uiSort: { key, dir: 'desc' } };
    }

    this.codesDirty = true;
    this.notifyKey('__list__');
  }

  // 정렬 키+방향 직접 지정
  setSortExplicit(key: SortKey, dir: SortDir) {
    const v = this.view;
    this.view = { ...v, sortKey: key, dir, uiSort: { key, dir } };
    this.codesDirty = true;
    this.notifyKey('__list__');
  }

  // ==================
  // getters
  // ==================
  getTicker(code: string) {
    return this.tickers.get(code);
  }

  getView() {
    return this.view;
  }

  getVisibleCodes(): string[] {
    if (!this.codesDirty) return this.cachedCodes;

    const { sortKey, dir, filter, query } = this.view;
    const q = query.trim().toLowerCase(); // 검색어

    // 1. 필터링
    // ========================
    let arr = Array.from(this.tickers.values());

    // 필터링 로직
    if (filter === 'holding') arr = arr.filter((t) => this.holding.has(t.code));
    if (filter === 'watchlist') arr = arr.filter((t) => this.watchlist.has(t.code));

    // 검색어 처리
    if (q) {
      arr = arr.filter((t) => {
        const code = t.code.replace('KRW-', '').toLowerCase();
        const kr = (t.koreanName ?? '').toLowerCase();
        return code.includes(q) || kr.includes(q);
      });
    }

    // 2. 정렬
    // ========================
    const mul = dir === 'asc' ? 1 : -1;

    arr.sort((a, b) => {
      let r = 0;

      if (sortKey === 'name') {
        r = (a.koreanName ?? '').localeCompare(b.koreanName ?? '', 'ko-KR');
      } else if (sortKey === 'acc') {
        r =
          a.accTradePrice24h === b.accTradePrice24h
            ? 0
            : a.accTradePrice24h > b.accTradePrice24h
              ? 1
              : -1;
      } else if (sortKey === 'price') {
        r = a.tradePrice === b.tradePrice ? 0 : a.tradePrice > b.tradePrice ? 1 : -1;
      } else if (sortKey === 'changeRate') {
        r =
          a.signedChangeRate === b.signedChangeRate
            ? 0
            : a.signedChangeRate > b.signedChangeRate
              ? 1
              : -1;
      }

      if (r !== 0) return r * mul;

      return a.code.localeCompare(b.code);
    });

    const next = arr.map((t) => t.code);

    const prev = this.cachedCodes;
    const isChanged =
      next.length !== prev.length || next.some((code, i) => code !== prev[i]);

    if (isChanged) this.cachedCodes = next;
    this.codesDirty = false;

    return this.cachedCodes;
  }
}
