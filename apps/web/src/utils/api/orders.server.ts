import { CompletedOrderWithFills } from '@/types/market.types';
import { GetOrdersQuery } from '@chart/shared-types';
import { cookies } from 'next/headers';
import { cache } from 'react';

export const getOrders = cache(async (params: GetOrdersQuery) => {
  const qs = new URLSearchParams();
  if (params.market) qs.append('market', params.market);
  if (params.view) qs.append('view', params.view);

  const url = `${process.env.NEXT_PUBLIC_API_URL}/orders?${qs.toString()}`;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  const res = await fetch(url, {
    method: 'GET',
    headers: accessToken ? { Cookie: `access_token=${accessToken}` } : {},
    cache: 'no-store',
  });

  if (!res.ok) {
    console.error('Failed to fetch orders', await res.text());
    throw new Error('Failed to fetch orders');
  }

  const json = (await res.json()) as {
    ok: boolean;
    orders: CompletedOrderWithFills[];
  };

  return json.orders;
});
