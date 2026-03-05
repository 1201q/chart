export async function initializeBalance(amount: number): Promise<void> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/balances/initialize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ amount }),
    cache: 'no-store',
  });

  if (!res.ok) {
    console.error('Failed to initialize balance', await res.text());
    throw new Error('Failed to initialize balance');
  }
}
