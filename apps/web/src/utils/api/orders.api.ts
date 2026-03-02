import { CreateOrderBody } from '@chart/shared-types';

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

export async function cancelOrder(orderId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${orderId}/cancel`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    console.error('Failed to cancel order', await res.text());
    throw new Error('Failed to cancel order');
  }

  return res.json();
}
