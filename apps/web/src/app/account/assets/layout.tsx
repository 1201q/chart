import {
  MarketTickerWithNamesMap,
  TradingBalanceDto,
  TradingPositionDto,
} from '@chart/shared-types';
import styles from './layout.module.css';
import AssetInfoPage from '@/components/account/AssetInfoPage';
import AccountAssetSkeleton from '@/components/account/AccountAssetSkeleton';
import { cookies } from 'next/headers';
import { Suspense } from 'react';

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

  const snapshot = await fetchSnapshot();
  const [balances, positions] = accessToken
    ? await Promise.all([fetchBalances(accessToken), fetchPositions(accessToken)])
    : [[], []];

  return (
    <div className={styles.wrapper}>
      <AssetInfoPage balances={balances} positions={positions} snapshot={snapshot} />
    </div>
  );
}

const Layout = () => {
  return (
    <Suspense fallback={<AccountAssetSkeleton />}>
      <AssetContent />
    </Suspense>
  );
};

export default Layout;
