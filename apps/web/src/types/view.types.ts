// 1. coinList ========================================================
// coinlist에서의 정렬 키와 방향
export type SortKey = 'acc' | 'name' | 'price' | 'changeRate';
export type SortDir = 'asc' | 'desc';

// coinlist에서의 필터 모드
export type FilterMode = 'all' | 'holding' | 'watchlist';

export type TickerListUiSort = { key: SortKey; dir: SortDir } | null;

export type TickerListView = {
  sortKey: SortKey;
  dir: SortDir;
  filter: FilterMode;
  query: string; // 검색어
  uiSort: TickerListUiSort;
};

export const DEFAULT_COIN_LIST_VIEW: TickerListView = {
  sortKey: 'acc',
  dir: 'desc',
  filter: 'all',
  query: '',
  uiSort: { key: 'acc', dir: 'desc' },
};
