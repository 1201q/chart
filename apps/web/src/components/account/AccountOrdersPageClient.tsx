'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import AccountShell from './AccountShell';
import { CompletedOrderWithFills } from '@/types/market.types';
import { MarketTickerWithNamesMap } from '@chart/shared-types';
import AccountOrderList from './AccountOrderList';
import AccountOrderDetail from './AccountOrderDetail';

interface AccountOrdersPageClientProps {
  orders: CompletedOrderWithFills[];
  tickers: MarketTickerWithNamesMap;
  range: string;
  selectedId: string | null;
  selectedOrder?: CompletedOrderWithFills | null;
}

export default function AccountOrdersPageClient({
  orders,
  tickers,
  range,
  selectedId,
}: AccountOrdersPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 낙관적 로컬 상태: 클릭 즉시 반응, URL 동기화는 백그라운드에서
  const [localSelectedId, setLocalSelectedId] = useState(selectedId);

  // 브라우저 뒤로가기/앞으로가기 시 서버 props와 동기화
  useEffect(() => {
    setLocalSelectedId(selectedId);
  }, [selectedId]);

  const replaceQuery = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(patch).forEach(([key, value]) => {
      if (value === null) params.delete(key);
      else params.set(key, value);
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const pushQuery = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(patch).forEach(([key, value]) => {
      if (value === null) params.delete(key);
      else params.set(key, value);
    });
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const onChangeRange = (newRange: string) => {
    setLocalSelectedId(null);
    replaceQuery({ range: newRange, id: null });
  };

  const onSelectOrder = (orderId: string) => {
    setLocalSelectedId(orderId); // 즉시 UI 반응
    pushQuery({ id: orderId }); // URL 동기화 (백그라운드)
  };

  // 이미 로드된 orders에서 즉시 탐색 (네트워크 불필요)
  const selectedOrder = localSelectedId
    ? (orders.find((o) => o.id === localSelectedId) ?? null)
    : null;

  const isDetailOpen = !!localSelectedId;

  return (
    <AccountShell
      isDetailOpen={isDetailOpen}
      ordersComponent={
        <AccountOrderList
          data={orders}
          snapshot={tickers}
          selectedId={localSelectedId}
          range={range}
          onChangeRange={onChangeRange}
          onSelectOrder={onSelectOrder}
        />
      }
      detailComponent={
        selectedOrder
          ? (() => {
              const { fills, ...orderWithoutFills } = selectedOrder;
              const market = selectedOrder.market;
              const koreanName = market ? tickers[market]?.koreanName || '' : '';

              return (
                <AccountOrderDetail
                  order={orderWithoutFills}
                  fills={fills}
                  koreanName={koreanName}
                />
              );
            })()
          : null
      }
    />
  );
}
