'use client';

import { TradingFillDto, TradingOrderDto } from '@chart/shared-types';
import styles from './styles/order.form.history.module.css';
import { useEffect, useState } from 'react';
import CompletedOrderItem from './CompletedOrderItem';

export type CompletedOrderWithFills = TradingOrderDto & {
  fills: TradingFillDto[];
};

const CompletedOrderList = ({ code }: { code: string }) => {
  const [list, setList] = useState<CompletedOrderWithFills[]>([]);

  const fetchOrders = async () => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/orders?market=${code}&view=completed`;

    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) return [];

      const json = (await res.json()) as {
        ok: boolean;
        orders: CompletedOrderWithFills[];
      };

      return json.orders;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      if (e.name === 'AbortError') {
        return [];
      }

      return [];
    }
  };

  useEffect(() => {
    fetchOrders().then((orders) => setList(orders));
  }, []);

  return (
    <>
      <div className={styles.listViewport}>
        <div className={styles.completedList}>
          {[...list]
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
            ))}
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
