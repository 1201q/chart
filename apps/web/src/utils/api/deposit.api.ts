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

export interface DepositStatus {
  depositMonth: string;
  used: number;
  remaining: number;
  limit: number;
}

export interface DepositHistoryItem {
  id: string;
  amount: number;
  depositMonth: string;
  createdAt: string;
}

export async function depositKrw(amount: number): Promise<{
  ok: boolean;
  amount: number;
  depositMonth: string;
  remaining: number;
}> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/deposit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ amount }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to deposit');
  }

  return res.json();
}

export async function getDepositStatus(): Promise<DepositStatus> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/deposit/status`, {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Failed to fetch deposit status');
  return res.json();
}

export async function getDepositHistory(): Promise<{ ok: boolean; history: DepositHistoryItem[] }> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/deposit/history`, {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Failed to fetch deposit history');
  return res.json();
}
