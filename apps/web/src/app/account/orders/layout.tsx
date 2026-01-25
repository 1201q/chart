'use client';

import AccountShell from '@/components/account/AccountShell';
import { usePathname } from 'next/navigation';

export default function OrdersLayout({
  children,
  detail,
}: {
  children: React.ReactNode;
  detail: React.ReactNode;
}) {
  const pathname = usePathname();

  // detail 페이지인지 확인
  const hasDetail = pathname.includes('/orders/') && pathname !== '/account/orders';

  return (
    <AccountShell
      isDetailOpen={hasDetail}
      ordersComponent={children}
      detailComponent={detail}
    />
  );
}
