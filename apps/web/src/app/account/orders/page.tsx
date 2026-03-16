import type { Metadata } from 'next';
import AccountOrdersPageClient from '@/components/account/AccountOrdersPageClient';

export const metadata: Metadata = {
  title: '차트레이더스 | 주문내역',
};
import AccountOrdersSkeleton from '@/components/account/AccountOrdersSkeleton';
import SuspenseMark from '@/components/profiler/SuspenseMark';
import { CompletedOrderWithFills } from '@/types/market.types';
import { getOrders } from '@/utils/api/orders.server';
import { TradingOrderDto } from '@chart/shared-types';
import { Suspense } from 'react';

function kstDefaultRange() {
  // Asia/Seoul 기준 "YYYY_MM"
  // en-us로 해야 01, 02 형태로 month가 나옴
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());

  const y = parts.find((p) => p.type === 'year')?.value ?? '2026';
  const m = parts.find((p) => p.type === 'month')?.value ?? '01';
  return `${y}_${m}`;
}

function timeKey(o: TradingOrderDto) {
  return typeof o.createdAt === 'string'
    ? Date.parse(o.createdAt)
    : o.createdAt.getTime();
}

async function OrdersContent({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const sp = await searchParams;

  const range = sp.range ?? kstDefaultRange();

  const ordersRaw = await getOrders({ range, view: 'completed' });

  const orders = [...(ordersRaw as CompletedOrderWithFills[])].sort(
    (a, b) => timeKey(b) - timeKey(a),
  );

  return (
    <AccountOrdersPageClient
      orders={orders}
      range={range}
    />
  );
}

const Page = ({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) => {
  return (
    <Suspense fallback={<SuspenseMark name="orders-content"><AccountOrdersSkeleton /></SuspenseMark>}>
      <OrdersContent searchParams={searchParams} />
    </Suspense>
  );
};

export default Page;
