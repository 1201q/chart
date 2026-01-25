'use client';

import {
  TradingPositionDto,
  MarketTickerWithNamesMap,
  TradingBalanceDto,
} from '@chart/shared-types';
import styles from './styles/asset.info.module.css';
import Image from 'next/image';
import { formatSignedChangeRate } from '@/utils/formatting/changeRate';

import { useEffect, useRef } from 'react';

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

export default function AssetInfos({
  positions,
  snapshot,
  balances,
}: {
  positions: TradingPositionDto[];
  snapshot: MarketTickerWithNamesMap;
  balances: TradingBalanceDto[];
}) {
  const tableViewportRef = useStickyFade();
  const krwBalance = balances.find((b) => b.currency === 'KRW');
  const krwAvailable = krwBalance ? Number(krwBalance.available) : 0;
  const krwLocked = krwBalance ? Number(krwBalance.locked) : 0;

  const krwTotal = krwAvailable + krwLocked;

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

  const totalEval = rows.reduce((sum, r) => sum + r.evalAmount, 0);
  const totalCost = rows.reduce((sum, r) => sum + r.cost, 0);
  const totalProfit = rows.reduce((sum, r) => sum + r.profit, 0);
  const totalChangeRate = totalCost > 0 ? totalProfit / totalCost : 0;

  return (
    <div className={styles.wrapper}>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>원화</h3>
        <div className={styles.krwWrapper}>
          <div className={styles.simpleRow}>
            <p className={styles.simpleLeft}>주문가능 원화</p>
            <p className={styles.simpleRight}>
              {krwAvailable.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
            </p>
          </div>
          <div className={styles.simpleRow}>
            <p className={styles.simpleLeft}>주문중</p>
            <p className={styles.simpleRight}>
              {krwLocked.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
            </p>
          </div>
        </div>

        <p className={styles.krwTotal}>
          총 {krwTotal.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
        </p>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>가상자산</h3>

        <div
          className={styles.tableViewport}
          ref={tableViewportRef}
          data-scrolled="false"
        >
          <div className={styles.table}>
            {/* header */}
            <div className={`${styles.tr} ${styles.headRow}`}>
              <div className={`${styles.th} ${styles.stickyCol}`}>종목명</div>
              <div className={styles.th}>평가금액</div>
              <div className={styles.th}>매수금액</div>
              <div className={styles.th}>평가손익</div>
              <div className={styles.th}>수익률</div>
              <div className={styles.th}>보유수량</div>
              <div className={styles.th}>평균단가</div>
            </div>
            {/* body */}
            {rows.map((r) => {
              const sign = r.profit > 0 ? '+' : r.profit < 0 ? '-' : '';
              const colorType =
                r.changeRate > 0
                  ? styles.rise
                  : r.changeRate < 0
                    ? styles.fall
                    : styles.even;

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
      </section>
    </div>
  );
}
