import AccountOrderList from '@/components/account/AccountOrderList';
import AccountOrderPageClient from '@/components/account/AccountOrderPageClient';

import { getOrders } from '@/utils/api/orders.api';
import { getTickers } from '@/utils/api/ticker.api';
import { Suspense } from 'react';

export default async function OrdersLayout({
  children,
  detail,
}: {
  children: React.ReactNode;
  detail: React.ReactNode;
}) {
  const [orders, tickers] = await Promise.all([getOrders({}), getTickers()]);

  return (
    <Suspense fallback={<div>Loading orders...</div>}>
      <AccountOrderPageClient
        list={<AccountOrderList data={orders} snapshot={tickers} />}
        detail={detail}
      />
    </Suspense>
  );
}
