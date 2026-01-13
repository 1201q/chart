import { CreateOrderBody, GetOrdersQuery } from '@chart/shared-types';
import { CompletedOrderWithFills } from '@/components/order/CompletedOrderList';

export async function createOrder(body: CreateOrderBody) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!res.ok) {
    console.error('Failed to create order', await res.text());
    throw new Error('Failed to create order');
  }

  const json = await res.json();

  return json;
}

export async function getOrders(params: GetOrdersQuery) {
  const qs = new URLSearchParams();
  if (params.market) qs.append('market', params.market);
  if (params.view) qs.append('view', params.view);

  const url = `${process.env.NEXT_PUBLIC_API_URL}/orders?${qs.toString()}`;

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
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
}
