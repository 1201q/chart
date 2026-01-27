'use client';

import { usePathname } from 'next/navigation';
import AccountOrderController from './AccountOrderController';
import AccountShell from './AccountShell';

export default function AccountOrderPageClient({
  list,
  detail,
}: {
  list: React.ReactNode;
  detail: React.ReactNode;
}) {
  const pathname = usePathname();
  const hasDetail = pathname !== '/account/orders';

  return (
    <>
      <AccountOrderController isDetail={hasDetail} />
      <AccountShell
        isDetailOpen={hasDetail}
        ordersComponent={list}
        detailComponent={detail}
      />
    </>
  );
}
