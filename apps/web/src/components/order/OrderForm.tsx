'use client';

import { useState } from 'react';
import { PriceInput } from './PriceInput';
import styles from './styles/order.form.module.css';

import { AmountInput } from './AmountInput';

const OrderForm = ({ code }: { code: string }) => {
  const [value, setValue] = useState<number | null>(null);

  return (
    <div className={styles.orderform}>
      <div className={styles.tabMenu}></div>
      <ul className={styles.options}>
        <li className={styles.option}>
          <span>{'주문가능'}</span>
          <div className={styles.optionContent}>
            <div className={styles.rowWrapper}>
              <p className={styles.valueText}>1,000</p>
              <p className={styles.unitText}>원</p>
            </div>
          </div>
        </li>
        <li className={styles.option}>
          <span>{'가격'}</span>
          <div className={styles.optionContent}>
            <PriceInput value={value} onChange={(v) => setValue(v)} />
          </div>
        </li>
        <li className={styles.option}>
          <span>{'수량'}</span>
          <div className={styles.optionContent}>
            <AmountInput value={value} onChange={(v) => setValue(v)} code={code} />
            <div className={styles.buttonWrapper}>
              <button>10%</button> <button>25%</button> <button>50%</button>{' '}
              <button>전체</button>
            </div>
          </div>
        </li>
      </ul>
      <div className={styles.orderResult}>
        <h2>주문 금액</h2>
        <span>0원</span>
      </div>
    </div>
  );
};

export default OrderForm;
