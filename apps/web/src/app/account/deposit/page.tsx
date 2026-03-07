import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: '차트레이더스 | 원화입금',
};
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getMe } from '@/utils/api/auth.api';
import DepositPageClient from '@/components/account/DepositPageClient';
import AccountDepositSkeleton from '@/components/account/AccountDepositSkeleton';
import { DepositHistoryItem, DepositStatus } from '@/utils/api/deposit.api';

async function fetchDepositStatus(accessToken: string): Promise<DepositStatus | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/deposit/status`, {
      cache: 'no-store',
      headers: { Cookie: `access_token=${accessToken}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchDepositHistory(accessToken: string): Promise<DepositHistoryItem[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/deposit/history`, {
      cache: 'no-store',
      headers: { Cookie: `access_token=${accessToken}` },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.history ?? [];
  } catch {
    return [];
  }
}

async function DepositContent() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) redirect('/login');

  const user = await getMe();
  if (!user?.isInitialized) redirect('/account/assets');

  const [status, history] = await Promise.all([
    fetchDepositStatus(accessToken),
    fetchDepositHistory(accessToken),
  ]);

  const defaultStatus: DepositStatus = status ?? {
    depositMonth: new Date().toISOString().slice(0, 7).replace('-', '_'),
    used: 0,
    remaining: 3,
    limit: 3,
  };

  return <DepositPageClient status={defaultStatus} history={history} />;
}

export default function Page() {
  return (
    <Suspense fallback={<AccountDepositSkeleton />}>
      <DepositContent />
    </Suspense>
  );
}
