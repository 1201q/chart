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
type TickerKey = string | '__list__' | '__view__';
type ListRecomputeReason = 'filter' | 'query' | 'sort' | 'stream';

class ListBus extends ExternalStoreBase {
  notifyListeners() {
    this.notify();
  }
}

// 필요 없으면 이후 제거
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

    const merged: MarketTickerWithNames = {
      ...prev,
      ...ticker,
    };

    this.tickers.set(ticker.code, merged);

    this.dirty = true;
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

  private holding = new Set<string>();
  private watchlist = new Set<string>();

  private view: TickerListView = DEFAULT_COIN_LIST_VIEW;

  private cachedCodes: string[] = [];
  private codesDirty = true;

  private listRecomputeTimer: ReturnType<typeof setTimeout> | null = null;
  private streamStartedAt = typeof performance !== 'undefined' ? performance.now() : 0;

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
  // subscribe
  // ==================
  subscribeList(listener: Listener) {
    return this.subscribeKey('__list__', listener);
  }

  subscribeView(listener: Listener) {
    return this.subscribeKey('__view__', listener);
  }

  // ==================
  // metrics (dev)
  // ==================
  private markListRecomputeStart() {
    if (process.env.NODE_ENV !== 'development') return;
    performance.mark('ticker_list_recompute_start');
  }

  private markListRecomputeEnd() {
    if (process.env.NODE_ENV !== 'development') return;
    performance.mark('ticker_list_recompute_end');
    performance.measure(
      'ticker_list_recompute_ms',
      'ticker_list_recompute_start',
      'ticker_list_recompute_end',
    );
  }

  // ==================
  // internal
  // ==================
  private canReorderFromStream() {
    if (typeof performance === 'undefined') return true;
    return performance.now() - this.streamStartedAt > 1500;
  }

  private getListRecomputeDelay(reason: ListRecomputeReason): number {
    if (reason === 'filter' || reason === 'query' || reason === 'sort') {
      return 0;
    }

    if (this.view.sortKey === 'name') return 0;
    if (this.view.sortKey === 'acc') return 300;
    if (this.view.sortKey === 'price') return 180;
    if (this.view.sortKey === 'changeRate') return 120;

    return 150;
  }

  private shouldTickAffectList(
    prev: MarketTickerWithNames,
    next: MarketTickerWithNames,
  ): boolean {
    const { sortKey } = this.view;

    if (sortKey === 'name') return false;
    if (sortKey === 'acc') return prev.accTradePrice24h !== next.accTradePrice24h;
    if (sortKey === 'price') return prev.tradePrice !== next.tradePrice;
    if (sortKey === 'changeRate') return prev.signedChangeRate !== next.signedChangeRate;

    return false;
  }

  private getBaseTickersForFilter(): MarketTickerWithNames[] {
    const { filter } = this.view;

    if (filter === 'watchlist') {
      const arr: MarketTickerWithNames[] = [];
      for (const code of this.watchlist) {
        const ticker = this.tickers.get(code);
        if (ticker) arr.push(ticker);
      }
      return arr;
    }

    if (filter === 'holding') {
      const arr: MarketTickerWithNames[] = [];
      for (const code of this.holding) {
        const ticker = this.tickers.get(code);
        if (ticker) arr.push(ticker);
      }
      return arr;
    }

    return Array.from(this.tickers.values());
  }

  private computeVisibleCodes(): string[] {
    const { sortKey, dir, query } = this.view;
    const q = query.trim().toLowerCase();

    let arr = this.getBaseTickersForFilter();

    if (q) {
      arr = arr.filter((t) => {
        const code = t.code.replace('KRW-', '').toLowerCase();
        const kr = (t.koreanName ?? '').toLowerCase();
        return code.includes(q) || kr.includes(q);
      });
    }

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

    return arr.map((t) => t.code);
  }

  private recomputeVisibleCodes() {
    this.markListRecomputeStart();

    const next = this.computeVisibleCodes();
    const prev = this.cachedCodes;

    const isChanged =
      next.length !== prev.length || next.some((code, i) => code !== prev[i]);

    if (isChanged) {
      this.cachedCodes = next;
    }

    this.codesDirty = false;

    this.markListRecomputeEnd();
  }

  private flushListRecompute() {
    this.codesDirty = true;
    this.recomputeVisibleCodes();
    this.notifyKey('__list__');
  }

  private scheduleListRecompute(reason: ListRecomputeReason) {
    if (this.listRecomputeTimer) {
      return;
    }

    const delay = this.getListRecomputeDelay(reason);

    this.listRecomputeTimer = setTimeout(() => {
      this.listRecomputeTimer = null;
      this.flushListRecompute();
    }, delay);
  }

  private notifyView() {
    this.notifyKey('__view__');
  }

  // ==================
  // updates
  // ==================
  upsertFromStream(ticker: MarketTicker) {
    const prev = this.tickers.get(ticker.code);
    if (!prev) return;

    const merged: MarketTickerWithNames = {
      ...prev,
      ...ticker,
    };

    this.tickers.set(ticker.code, merged);

    this.notifyKey(ticker.code);

    if (this.shouldTickAffectList(prev, merged) && this.canReorderFromStream()) {
      this.scheduleListRecompute('stream');
    }
  }

  // ==================
  // set
  // ==================
  setHoldingCodes(codes: string[]) {
    this.holding = new Set(codes);
    this.scheduleListRecompute('filter');
  }

  setWatchlistCodes(codes: string[]) {
    this.watchlist = new Set(codes);
    this.scheduleListRecompute('filter');
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

    this.notifyKey(code);
    this.scheduleListRecompute('filter');
  }

  setFilter(filter: FilterMode) {
    if (this.view.filter === filter) return;

    this.view = { ...this.view, filter };
    this.notifyView();
    this.scheduleListRecompute('filter');
  }

  setQuery(query: string) {
    if (this.view.query === query) return;

    this.view = { ...this.view, query };
    this.notifyView();
    this.scheduleListRecompute('query');
  }

  setSort(key: SortKey) {
    const v = this.view;

    if (v.sortKey !== key) {
      this.view = { ...v, sortKey: key, dir: 'desc', uiSort: { key, dir: 'desc' } };
      this.notifyView();
      this.scheduleListRecompute('sort');
      return;
    }

    if (v.uiSort?.key === key && v.uiSort.dir === 'desc') {
      this.view = { ...v, dir: 'asc', uiSort: { key, dir: 'asc' } };
    } else if (v.uiSort?.key === key && v.uiSort.dir === 'asc') {
      this.view = {
        ...v,
        sortKey: DEFAULT_COIN_LIST_VIEW.sortKey,
        dir: DEFAULT_COIN_LIST_VIEW.dir,
        uiSort: DEFAULT_COIN_LIST_VIEW.uiSort,
      };
    } else {
      this.view = { ...v, sortKey: key, dir: 'desc', uiSort: { key, dir: 'desc' } };
    }

    this.notifyView();
    this.scheduleListRecompute('sort');
  }

  setSortExplicit(key: SortKey, dir: SortDir) {
    const v = this.view;
    this.view = { ...v, sortKey: key, dir, uiSort: { key, dir } };
    this.notifyView();
    this.scheduleListRecompute('sort');
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
    if (this.codesDirty) {
      this.recomputeVisibleCodes();
    }

    return this.cachedCodes;
  }
}
