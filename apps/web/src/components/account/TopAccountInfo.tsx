'use client';

import { TradingBalanceDto, TradingPositionDto } from '@chart/shared-types';
import styles from './styles/top.account.info.module.css';
import { formatSignedChangeRate } from '@/utils/formatting/changeRate';

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

const TopAccountInfo = ({
  positions,
  balances,
  assetRows,
  krwTotal,
  krwAvailable,
}: {
  positions: TradingPositionDto[];
  balances: TradingBalanceDto[];
  assetRows: RowData[];
  krwTotal: number;
  krwAvailable: number;
}) => {
  const coinSum = positions.reduce((acc, pos) => acc + Number(pos.cost), 0);
  const krw = balances.find((b) => b.currency === 'KRW');
  const krwSum = krw ? Number(krw.available) + Number(krw.locked) : 0;

  const totalEval = assetRows.reduce((sum, r) => sum + r.evalAmount, 0);
  const totalCost = assetRows.reduce((sum, r) => sum + r.cost, 0);
  const totalProfit = assetRows.reduce((sum, r) => sum + r.profit, 0);
  const totalChangeRate = totalCost > 0 ? totalProfit / totalCost : 0;

  const profitSign = totalProfit > 0 ? '+' : totalProfit < 0 ? '-' : '';

  return (
    <div className={styles.wrapper}>
      <h3>내 자산</h3>
      <h2>
        {Number(krwSum + coinSum).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
      </h2>
      <div className={styles.infos}>
        <InfoItem
          label="수익률"
          value={`${formatSignedChangeRate(totalChangeRate)}%`}
          pcOrder={0}
          changeRate={totalChangeRate}
        />
        <InfoItem
          label="평가손익"
          value={`${profitSign}
                ${Math.abs(totalProfit).toLocaleString('ko-KR', {
                  maximumFractionDigits: 0,
                })}`}
          pcOrder={1}
        />
        <InfoItem
          label="보유원화"
          value={`${krwTotal.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}`}
          pcOrder={3}
        />
        <InfoItem
          label="평가금액"
          value={`${totalEval.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}`}
          pcOrder={2}
        />
        <InfoItem
          label="주문가능"
          value={`${krwAvailable.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}`}
          pcOrder={4}
        />
        <InfoItem
          label="매수금액"
          value={`${totalCost.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}`}
          pcOrder={5}
        />
      </div>
    </div>
  );
};

const InfoItem = ({
  label,
  value,
  pcOrder,
  changeRate,
}: {
  label: string;
  value: string;
  pcOrder?: number;
  changeRate?: number;
}) => {
  return (
    <div className={`${styles.infoItem}`} style={pcOrder ? { order: pcOrder } : {}}>
      <span className={styles.label}>{label}</span>
      <span
        className={`${styles.value} ${changeRate ? (changeRate > 0 ? styles.rise : changeRate < 0 ? styles.fall : styles.even) : ''}`}
      >
        {value}
      </span>
    </div>
  );
};

export default TopAccountInfo;
