'use client';

import { TradingBalanceDto, TradingPositionDto } from '@chart/shared-types';
import styles from './styles/top.account.info.module.css';

const TopAccountInfo = ({
  positions,
  balances,
}: {
  positions: TradingPositionDto[];
  balances: TradingBalanceDto[];
}) => {
  console.log(positions);

  const coinSum = positions.reduce((acc, pos) => acc + Number(pos.cost), 0);
  const krw = balances.find((b) => b.currency === 'KRW');
  const krwSum = krw ? Number(krw.available) + Number(krw.locked) : 0;

  return (
    <div className={styles.wrapper}>
      <h3>내 자산</h3>
      <h2>
        {Number(krwSum + coinSum).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
      </h2>
    </div>
  );
};

export default TopAccountInfo;
