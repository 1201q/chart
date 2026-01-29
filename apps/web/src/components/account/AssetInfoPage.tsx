'use client';

import {
  TradingPositionDto,
  MarketTickerWithNamesMap,
  TradingBalanceDto,
} from '@chart/shared-types';
import styles from './styles/asset.info.module.css';

import AssetTable from './AssetTable';
import TopAccountInfo from './TopAccountInfo';
import AssetPortfolio from './AssetPortfolio';

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

type ChartData = {
  key: string; // 'BTC'
  label: string; // '한국어 네임'
  value: number; // 원화 평가액
  color: string;
};

export const COLOR_TONE = [
  '#2F6BFF', // blue
  '#00C2B3', // mint/teal
  '#FFD43B', // lemon
  '#FF8A3D', // orange
  '#C084FC', // purple
  '#FF4D6D', // rose
  '#22C55E', // green

  '#A3E635', // lime
  '#00A3FF', // sky
  '#F59E0B', // amber (골드)

  '#64748B', // steel
  '#CBD5E1', // light gray
] as const;

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

  const chartData: ChartData[] = rows
    .sort((a, b) => b.evalAmount - a.evalAmount)
    .map((r, index) => ({
      key: r.code,
      label: r.name,
      value: r.evalAmount,
      color: COLOR_TONE[index % COLOR_TONE.length],
    }));

  return (
    <div className={styles.wrapper}>
      <TopAccountInfo
        balances={balances}
        positions={positions}
        assetRows={rows}
        krwTotal={krwTotal}
        krwAvailable={krwAvailable}
      />
      <AssetPortfolio data={chartData} />
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>가상자산</h3>
        <AssetTable rows={rows} />
      </section>
    </div>
  );
}
