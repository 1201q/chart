import { CompletedOrderWithFills } from '@/components/order/CompletedOrderList';

// create order API
export interface CreateOrderBody {
  market: string;
  side: 'BUY' | 'SELL';
  type: 'LIMIT';
  price: string;
  qty: string;
}
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

// get Orders api
export type OrdersView = 'pending' | 'completed';
export async function getOrders(params: { market: string; view: OrdersView }) {
  const qs = new URLSearchParams({
    market: params.market,
    view: params.view,
  });

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
