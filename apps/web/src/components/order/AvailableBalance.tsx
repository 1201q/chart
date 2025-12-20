'use client';

import styles from './styles/order.form.balance.module.css';
import { RefreshCcw } from 'lucide-react';

const AvailableBalance = () => {
  return (
    <div className={styles.balance}>
      <div className={styles.leftWrapper}>주문가능</div>
      <div className={styles.rightWrapper}>
        <span>0원</span>
        <button>
          <RefreshCcw size={11} strokeWidth={2.5} style={{ marginTop: '1px' }} />
        </button>
      </div>
    </div>
  );
};

export default AvailableBalance;
