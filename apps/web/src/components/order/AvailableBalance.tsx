'use client';

import { useTradingBalance } from '@/utils/balancesStore';
import styles from './styles/order.form.balance.module.css';
import { RefreshCcw } from 'lucide-react';
import { OrderMode } from '@/utils/orderFormStore';

interface AvailableBalanceProps {
  selectedTab: OrderMode;
  code: string;
}

const AvailableBalance = ({ selectedTab, code }: AvailableBalanceProps) => {
  return (
    <div className={styles.balance}>
      <div className={styles.leftWrapper}>주문가능</div>
      <div className={styles.rightWrapper}>
        {selectedTab === 'buy' ? <Krw /> : <Currency currency={code} />}

        <button>
          <RefreshCcw size={11} strokeWidth={2.5} style={{ marginTop: '1px' }} />
        </button>
      </div>
    </div>
  );
};

const Krw = () => {
  const { value, meta } = useTradingBalance('KRW');

  if (!meta.snapshoted) return <span className={`sk ${styles.skeleton}`}></span>;
  if (meta.error) return <span>-</span>;

  if (value === null) return <span>0원</span>;

  const krw = Number(value?.available).toLocaleString('ko-KR', {
    maximumFractionDigits: 0,
  });

  return <span>{krw}원</span>;
};

const Currency = ({ currency }: { currency: string }) => {
  const removeC = currency.replace('KRW-', '');
  const { value, meta } = useTradingBalance(removeC);

  if (!meta.snapshoted) return <span className={`sk ${styles.skeleton}`}></span>;
  if (meta.error) return <span>-</span>;
  if (value === null) return <span>0 {removeC}</span>;

  return (
    <span>
      {value?.available} {removeC}
    </span>
  );
};

export default AvailableBalance;
