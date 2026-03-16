import type { Metadata } from 'next';
import {
  MarketTickerWithNamesMap,
  TradingBalanceDto,
  TradingPositionDto,
} from '@chart/shared-types';

export const metadata: Metadata = {
  title: '차트레이더스 | 자산',
};
import styles from './layout.module.css';
import AssetInfoPage from '@/components/account/AssetInfoPage';
import AccountAssetSkeleton from '@/components/account/AccountAssetSkeleton';
import SuspenseMark from '@/components/profiler/SuspenseMark';
import { cookies } from 'next/headers';
import { Suspense } from 'react';
import { getMe } from '@/utils/api/auth.api';
import Link from 'next/link';

async function fetchBalances(accessToken: string): Promise<TradingBalanceDto[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/balances`, {
      cache: 'no-store',
      headers: { Cookie: `access_token=${accessToken}` },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.balances ?? [];
  } catch {
    return [];
  }
}
async function fetchPositions(accessToken: string): Promise<TradingPositionDto[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/positions`, {
    cache: 'no-store',
    headers: { Cookie: `access_token=${accessToken}` },
  });

  if (!res.ok) return [];

  const json = await res.json();
  return json.positions ?? [];
}

async function fetchSnapshot(): Promise<MarketTickerWithNamesMap> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickers/snapshot`, {
    cache: 'no-store',
  });

  return res.json();
}

async function AssetContent() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  const user = accessToken ? await getMe() : null;

  if (!user?.isInitialized) {
    return (
      <div className={styles.uninitializedWrapper}>
        <div className={styles.uninitializedIcon}>
          <span className={styles.uninitializedIconText}>₩</span>
        </div>
        <p className={styles.uninitializedTitle}>지갑이 아직 생성되지 않았습니다</p>
        <p className={styles.uninitializedDesc}>
          모의 거래를 시작하려면 초기 자산을 설정해야 합니다.
        </p>
        <Link href="/initialize" className={styles.uninitializedButton}>
          지갑 생성하기
        </Link>
      </div>
    );
  }

  const snapshot = await fetchSnapshot();
  const [balances, positions] = await Promise.all([
    fetchBalances(accessToken!),
    fetchPositions(accessToken!),
  ]);

  return (
    <div className={styles.wrapper}>
      <AssetInfoPage balances={balances} positions={positions} snapshot={snapshot} />
    </div>
  );
}

const Layout = () => {
  return (
    <Suspense fallback={<SuspenseMark name="assets-content"><AccountAssetSkeleton /></SuspenseMark>}>
      <AssetContent />
    </Suspense>
  );
};

export default Layout;
