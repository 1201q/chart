'use client';

import { PriceInput } from './PriceInput';
import styles from './styles/order.form.module.css';

import { QtyInput } from './QtyInput';
import OrderFormTabs from './OrderFormTabs';
import AvailableBalance from './AvailableBalance';
import OrderHistory from './OrderHistory';
import { useOrderFormActions, useOrderFormSelector } from '../provider/OrderFormProvider';
import { useMemo } from 'react';

const MIN_ORDER_KRW = 5000;

const OrderForm = ({ code }: { code: string }) => {
  const store = useOrderFormActions();
  const mode = useOrderFormSelector((s) => s.mode);
  const price = useOrderFormSelector((s) => s.price);
  const qty = useOrderFormSelector((s) => s.qty);

  const total = useMemo(() => {
    if (price === null || qty === null)
      return {
        value: 0,
        display: '0',
      };
    return {
      value: price * qty,
      display: (price * qty).toLocaleString('ko-KR', {
        maximumFractionDigits: 0,
      }),
    };
  }, [price, qty]);

  const canSubmit = total !== null && total.value >= MIN_ORDER_KRW;

  return (
    <div className={styles.orderform}>
      <div className={styles.topOrderWrapper}>
        <div className={styles.tabmenu}>
          <OrderFormTabs selectedTab={mode} onTabChange={(tab) => store.setMode(tab)} />
        </div>
        <ul className={styles.options}>
          <li className={styles.option}>
            <AvailableBalance />
          </li>
          <li className={styles.option}>
            <div className={styles.optionContent}>
              <PriceInput />
            </div>
          </li>
          <li className={styles.option}>
            <div className={styles.optionContent}>
              <QtyInput code={code} />
            </div>
          </li>
        </ul>

        <div className={styles.orderResult}>
          <h2>주문 금액</h2>
          <span>{total?.display} 원</span>
        </div>

        <div className={styles.orderButton}>
          <span>최소주문 5,000원 이상</span>
          <button
            disabled={!canSubmit}
            className={`${mode === 'buy' ? styles.buyButton : styles.sellButton}`}
          >
            주문
          </button>
        </div>
      </div>
      <div className={styles.bottomOrderWrapper}>
        <OrderHistory />
      </div>
    </div>
  );
};

export default OrderForm;
