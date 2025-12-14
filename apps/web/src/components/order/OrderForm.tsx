'use client';

import { useState } from 'react';
import { PriceInput } from './PriceInput';
import styles from './styles/order.form.module.css';

import { AmountInput } from './AmountInput';
import OrderFormTabs from './OrderFormTabs';

type OrderMode = 'buy' | 'sell';

const OrderForm = ({ code }: { code: string }) => {
  const [value, setValue] = useState<number | null>(null);
  const [mode, setMode] = useState<OrderMode>('buy');

  return (
    <div className={styles.orderform}>
      <div className={styles.tabmenu}>
        <OrderFormTabs selectedTab={mode} onTabChange={(tab) => setMode(tab)} />
      </div>
      <ul className={styles.options}>
        <li className={styles.option}>
          <div className={styles.optionContent}>
            <PriceInput mode={mode} value={value} onChange={(v) => setValue(v)} />
          </div>
        </li>
        <li className={styles.option}>
          <div className={styles.optionContent}>
            <AmountInput
              mode={mode}
              value={value}
              onChange={(v) => setValue(v)}
              code={code}
            />
          </div>
        </li>
      </ul>

      <div className={styles.orderResult}>
        <h2>주문 금액</h2>
        <span>0원</span>
      </div>

      <div className={styles.orderButton}>
        <span>최소주문 5,000원 이상</span>
        <button className={`${mode === 'buy' ? styles.buyButton : styles.sellButton}`}>
          주문
        </button>
      </div>
    </div>
  );
};

export default OrderForm;
