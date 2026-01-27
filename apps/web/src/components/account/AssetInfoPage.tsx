'use client';

import {
  TradingPositionDto,
  MarketTickerWithNamesMap,
  TradingBalanceDto,
} from '@chart/shared-types';
import styles from './styles/asset.info.module.css';

import AssetTable from './AssetTable';
import TopAccountInfo from './TopAccountInfo';

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

export default function AssetInfoPage({
  positions,
  snapshot,
  balances,
}: {
  positions: TradingPositionDto[];
  snapshot: MarketTickerWithNamesMap;
  balances: TradingBalanceDto[];
}) {
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

  return (
    <div className={styles.wrapper}>
      <TopAccountInfo
        balances={balances}
        positions={positions}
        assetRows={rows}
        krwTotal={krwTotal}
        krwAvailable={krwAvailable}
      />

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>가상자산</h3>
        <AssetTable rows={rows} />
      </section>
    </div>
  );
}
