import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './styles/asset.table.module.css';
import { formatSignedChangeRate } from '@/utils/formatting/changeRate';
import Image from 'next/image';
import { MarketTickerWithNamesMap, TradingPositionDto } from '@chart/shared-types';

interface AssetTableProps {
  positions: TradingPositionDto[];
  snapshot: MarketTickerWithNamesMap;
}

type RowData = {
  market: string;
  name: string;
  code: string;
  imgSrc: string;
  evalAmount: number;
  cost: number;
  profit: number;
  changeRate: number;
  qty: number;
  avgPrice: number;
  tradePrice: number;
};

type SortKey = 'evalAmount' | 'cost' | 'profit' | 'changeRate';
type SortDir = 'asc' | 'desc';
type SortState = { key: SortKey; dir: SortDir } | null; // null일 경우 evalAmount desc 기본 정렬

const SORT_DEFAULT: { key: SortKey; dir: SortDir } = { key: 'evalAmount', dir: 'desc' };

function useStickyFade() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onScroll = () => {
      el.dataset.scrolled = el.scrollLeft > 20 ? 'true' : 'false';
    };

    onScroll();

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
    };
  }, []);

  return ref;
}

const AssetTable = ({ positions, snapshot }: AssetTableProps) => {
  const tableViewportRef = useStickyFade();

  const [uiSort, setUiSort] = useState<SortState>(null);

  // 실제 정렬상태
  const effectiveSort = uiSort ?? SORT_DEFAULT;

  const rows: RowData[] = positions
    .map((p) => {
      const s = snapshot[p.market];
      if (!s) return null;

      const qty = Number(p.qty);
      const avgPrice = Number(p.avgPrice);
      const cost = Number(p.cost);
      const tradePrice = Number(s.tradePrice);

      const evalAmount = tradePrice * qty;
      const profit = (tradePrice - avgPrice) * qty;
      const changeRate = cost > 0 ? profit / cost : 0;

      const imgSrc = `${process.env.NEXT_PUBLIC_API_URL?.replace(
        '/mock',
        '',
      )}/markets/icon/${s.code.replace('KRW-', '').toUpperCase()}`;

      return {
        market: p.market,
        name: s.koreanName,
        code: s.code,
        imgSrc,
        evalAmount,
        cost,
        profit,
        changeRate,
        qty,
        avgPrice,
        tradePrice,
      };
    })
    .filter(Boolean) as RowData[];

  const sortedRows = useMemo(() => {
    const { key, dir } = effectiveSort;
    const dirMul = dir === 'asc' ? 1 : -1;

    return [...rows].sort((a, b) => {
      const va = a[key];
      const vb = b[key];
      if (va === vb) return 0;
      return dirMul * (va > vb ? 1 : -1);
    });
  }, [rows, effectiveSort]);

  const onSort = (key: SortKey) => {
    setUiSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 'desc' };

      // 같은 키 두번째 클릭: asc
      if (prev.dir === 'desc') return { key, dir: 'asc' };

      // 같은 키 세번째 클릭: 해제 -> 기본정렬로 돌아가(헤더 강조 없음)
      return null;
    });
  };

  const totalEval = rows.reduce((sum, r) => sum + r.evalAmount, 0);
  const totalCost = rows.reduce((sum, r) => sum + r.cost, 0);
  const totalProfit = rows.reduce((sum, r) => sum + r.profit, 0);
  const totalChangeRate = totalCost > 0 ? totalProfit / totalCost : 0;

  return (
    <div className={styles.tableViewport} ref={tableViewportRef} data-scrolled="false">
      <div className={styles.table}>
        {/* header */}
        <div className={`${styles.tr} ${styles.headRow}`}>
          <div className={`${styles.th} ${styles.stickyCol}`}>종목명</div>
          <div className={styles.th}>
            <SortField k={'evalAmount'} label="평가금액" onSort={onSort} sort={uiSort} />
          </div>
          <div className={styles.th}>
            <SortField k={'cost'} label="매수금액" onSort={onSort} sort={uiSort} />
          </div>
          <div className={styles.th}>
            <SortField k={'profit'} label="평가손익" onSort={onSort} sort={uiSort} />
          </div>
          <div className={styles.th}>
            <SortField k={'changeRate'} label="수익률" onSort={onSort} sort={uiSort} />
          </div>
          <div className={styles.th}>보유수량</div>
          <div className={styles.th}>평균단가</div>
        </div>
        {/* body */}
        {sortedRows.map((r) => {
          const sign = r.profit > 0 ? '+' : r.profit < 0 ? '-' : '';
          const colorType =
            r.changeRate > 0 ? styles.rise : r.changeRate < 0 ? styles.fall : styles.even;

          return (
            <div key={r.market} className={`${styles.tr} ${styles.bodyRow}`}>
              <div className={`${styles.td} ${styles.stickyCol}`}>
                <div className={styles.nameCell}>
                  <span className={styles.icon}>
                    <Image src={r.imgSrc} width={21} height={21} alt="" />
                  </span>

                  <div className={styles.nameTexts}>
                    <p className={styles.name}>{r.name}</p>
                    <p className={styles.sub}>{r.code.replaceAll('KRW-', '')}</p>
                  </div>
                </div>
              </div>
              <div className={`${styles.td} ${styles.num}`}>
                {r.evalAmount.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
              </div>

              <div className={`${styles.td} ${styles.num}`}>
                {r.cost.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
              </div>

              <div className={`${styles.td} ${styles.num} ${colorType}`}>
                {sign}
                {Math.abs(r.profit).toLocaleString('ko-KR', {
                  maximumFractionDigits: 0,
                })}
                원
              </div>

              <div className={`${styles.td} ${styles.num} ${colorType}`}>
                {formatSignedChangeRate(r.changeRate)}%
              </div>

              <div className={`${styles.td} ${styles.num}`}>
                {r.qty.toLocaleString('ko-KR', { maximumFractionDigits: 8 })}
              </div>

              <div className={`${styles.td} ${styles.num}`}>
                {r.avgPrice.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
              </div>
            </div>
          );
        })}

        {/* total */}
        {(() => {
          const sign = totalProfit > 0 ? '+' : totalProfit < 0 ? '-' : '';
          const totalColorType =
            totalChangeRate > 0
              ? styles.rise
              : totalChangeRate < 0
                ? styles.fall
                : styles.even;

          return (
            <div className={`${styles.tr} ${styles.totalRow}`}>
              {/* sticky col */}
              <div className={`${styles.td} ${styles.stickyCol}`}>
                <div className={styles.nameCell}>
                  <div className={styles.nameTexts}>
                    <p className={styles.name}></p>
                    <p className={styles.sub}></p>
                  </div>
                </div>
              </div>

              {/* 평가금액 */}
              <div className={`${styles.td} ${styles.num}`}>
                {totalEval.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
              </div>

              {/* 매수금액 */}
              <div className={`${styles.td} ${styles.num}`}>
                {totalCost.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
              </div>

              {/* 평가손익 */}
              <div className={`${styles.td} ${styles.num} ${totalColorType}`}>
                {sign}
                {Math.abs(totalProfit).toLocaleString('ko-KR', {
                  maximumFractionDigits: 0,
                })}
                원
              </div>

              {/* 수익률 */}
              <div className={`${styles.td} ${styles.num} ${totalColorType}`}>
                {formatSignedChangeRate(totalChangeRate)}%
              </div>

              {/*  보유수량 비우기 */}
              <div className={`${styles.td} ${styles.num}`}>-</div>

              {/* 평균단가 비우기 */}
              <div className={`${styles.td} ${styles.num}`}>-</div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

const SortField = ({
  label,
  k,
  sort,
  onSort,
}: {
  label: string;
  k: SortKey;
  sort: { key: SortKey; dir: SortDir } | null;
  onSort: (k: SortKey) => void;
}) => {
  const active = sort?.key === k;
  const dir = sort?.dir;

  return (
    <button className={styles.sortField} data-active={active} onClick={() => onSort(k)}>
      <span className={styles.sortLabel} data-active={active}>
        {label}
      </span>
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
    </button>
  );
};

export default AssetTable;
