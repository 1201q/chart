'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import AccountOrderController from './AccountOrderController';
import AccountShell from './AccountShell';
import { CompletedOrderWithFills } from '@/types/market.types';
import { MarketTickerWithNamesMap } from '@chart/shared-types';
import AccountOrderList from './AccountOrderList';
import AccountOrderDetail from './AccountOrderDetail';

interface AccountOrdersPageClientProps {
  orders: CompletedOrderWithFills[];
  tickers: MarketTickerWithNamesMap;
  range: string;
  side: 'all' | 'buy' | 'sell';
  selectedId: string | null;
  selectedOrder?: CompletedOrderWithFills | null;
}

export default function AccountOrdersPageClient({
  orders,
  tickers,
  range,
  selectedId,
  selectedOrder,
  side,
}: AccountOrdersPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  const onChangeSide = (newSide: 'all' | 'buy' | 'sell') => {
    replaceQuery({ side: newSide, id: null });
  };

  const onChangeRange = (newRange: string) => {
    replaceQuery({ range: newRange, id: null });
  };

  const onSelectOrder = (orderId: string) => {
    pushQuery({ id: orderId });
  };

  const isDetailOpen = !!selectedId;

  return (
    <>
      <AccountOrderController
        isDetail={isDetailOpen}
        selectedTab={side}
        onChangeSide={onChangeSide}
      />
      <AccountShell
        isDetailOpen={isDetailOpen}
        ordersComponent={
          <AccountOrderList
            data={orders}
            snapshot={tickers}
            selectedId={selectedId}
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
    </>
  );
}
