'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import AccountShell from './AccountShell';
import { CompletedOrderWithFills } from '@/types/market.types';
import { MarketTickerWithNamesMap } from '@chart/shared-types';
import AccountOrderList from './AccountOrderList';
import AccountOrderDetail from './AccountOrderDetail';
import { useTickerStore } from '@/hooks/uses/tickers.hooks';

interface AccountOrdersPageClientProps {
  orders: CompletedOrderWithFills[];
  range: string;
}

export default function AccountOrdersPageClient({
  orders,
  range,
}: AccountOrdersPageClientProps) {
  const store = useTickerStore();

  // koreanName은 정적 데이터 — 구독 없이 초기값만 읽으면 충분
  const tickers = useMemo<MarketTickerWithNamesMap>(() => {
    const map: MarketTickerWithNamesMap = {};
    for (const order of orders) {
      if (order.market) {
        const ticker = store.getTicker(order.market);
        if (ticker) map[order.market] = ticker;
      }
    }
    return map;
  }, [store, orders]);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // hash에서 초기 선택 ID 읽기 (URL 공유 지원)
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash.slice(1);
    return hash || null;
  });

  // 브라우저 뒤로가기/앞으로가기 시 hash와 동기화
  useEffect(() => {
    const onPopState = () => {
      const hash = window.location.hash.slice(1);
      setLocalSelectedId(hash || null);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const onChangeRange = (newRange: string) => {
    setLocalSelectedId(null);
    // range 변경 시 hash도 제거 후 router로 RSC 재실행 (range는 서버 상태)
    const params = new URLSearchParams(searchParams.toString());
    params.set('range', newRange);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const onSelectOrder = (orderId: string) => {
    setLocalSelectedId(orderId); // 즉시 UI 반응
    // hash 변경 — RSC 재실행 없음
    const params = searchParams.toString();
    window.history.pushState(null, '', `${pathname}${params ? '?' + params : ''}#${orderId}`);
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
