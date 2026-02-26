'use client';

import { PriceInput } from './NewPriceInput';
import styles from '../styles/order.form.module.css';

import { QtyInput } from './NewQtyInput';
import OrderFormTabs from './NewOrderFormTabs';
import AvailableBalance from './NewAvailableBalance';
import OrderHistory from './NewOrderHistory';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useOrderFormActions, useOrderFormSelector } from '@/hooks/uses/orderform.hooks';

const MIN_ORDER_KRW = 5000;

const OrderForm = ({
  code,
  hideHistory,
  authenticated = true,
}: {
  code: string;
  hideHistory?: boolean;
  authenticated?: boolean;
}) => {
  const router = useRouter();
  const store = useOrderFormActions();
  const side = useOrderFormSelector((s) => s.side);
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
      <form
        method="post"
        onSubmit={(e) => {
          e.preventDefault();
          console.log(e);
        }}
        className={styles.topOrderWrapper}
      >
        <div className={styles.tabmenu}>
          <OrderFormTabs selectedTab={side} onTabChange={(tab) => store.setSide(tab)} />
        </div>
        <ul className={styles.options}>
          <li className={styles.option}>
            <AvailableBalance selectedTab={side} code={code} />
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
          {authenticated ? (
            <>
              <span>최소주문 5,000원 이상</span>
              <button
                type="submit"
                disabled={!canSubmit}
                className={`${side === 'BUY' ? styles.buyButton : styles.sellButton}`}
              >
                주문
              </button>
            </>
          ) : (
            <button
              type="button"
              className={`${side === 'BUY' ? styles.buyButton : styles.sellButton}`}
              onClick={() => router.push('/login')}
            >
              로그인하고 주문하기
            </button>
          )}
        </div>
      </form>
      {!hideHistory && (
        <div className={styles.bottomOrderWrapper}>
          <OrderHistory />
        </div>
      )}
    </div>
  );
};

export default OrderForm;
