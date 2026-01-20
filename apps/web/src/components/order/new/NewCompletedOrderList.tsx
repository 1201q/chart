'use client';

import { TradingFillDto, TradingOrderDto } from '@chart/shared-types';
import styles from '../styles/order.form.history.module.css';

import CompletedOrderItem from './NewCompletedOrderItem';
import { useCompletedOrders } from '@/hooks/uses/trading.hooks';

export type CompletedOrderWithFills = TradingOrderDto & {
  fills: TradingFillDto[];
};

const CompletedOrderList = ({ code }: { code: string }) => {
  const list = useCompletedOrders();

  console.log(list);

  return (
    <>
      <div className={styles.listViewport}>
        <div className={styles.completedList}>
          {/* {[...list]
            .sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            )
            .map((o) => (
              <CompletedOrderItem
                key={o.id}
                data={o}
                side={o.side}
                filledAt={o.filledAt}
              />
            ))} */}
        </div>
        {list.length === 0 && (
          <div className={styles.emptyList}>
            <span>주문 내역이 없습니다.</span>
          </div>
        )}
      </div>
    </>
  );
};

export default CompletedOrderList;
