'use client';

import { TradingOrderDto } from '@chart/shared-types';
import styles from './styles/order.form.history.module.css';

const CompletedOrderList = () => {
  const fetchOrders = async () => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/orders`;

    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) return [];

      return (await res.json()) as { ok: boolean; orders: TradingOrderDto[] };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      if (e.name === 'AbortError') {
        return [];
      }

      return [];
    }
  };

  return <div></div>;
};

export default CompletedOrderList;
