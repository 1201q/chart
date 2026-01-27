'use client';

import {
  TradingPositionDto,
  MarketTickerWithNamesMap,
  TradingBalanceDto,
} from '@chart/shared-types';
import styles from './styles/asset.info.module.css';

import AssetKrwInfos from './AssetKrwInfos';
import AssetTable from './AssetTable';

export default function AssetInfos({
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

  return (
    <div className={styles.wrapper}>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>원화</h3>
        <AssetKrwInfos available={krwAvailable} locked={krwLocked} total={krwTotal} />
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>가상자산</h3>
        <AssetTable positions={positions} snapshot={snapshot} />
      </section>
    </div>
  );
}
