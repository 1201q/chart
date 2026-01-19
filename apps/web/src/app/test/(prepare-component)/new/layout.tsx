import LoadingSpinner from '@/components/LoadingSpinner';
import { NewTickerProvider } from '@/components/provider/NewTickerProvider';

import { MarketTickerWithNamesMap } from '@chart/shared-types';
import { Suspense } from 'react';

async function fetchSnapshot(): Promise<MarketTickerWithNamesMap> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickers/snapshot`, {
    cache: 'no-store',
  });

  return res.json();
}

export default async function MarketLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const snapshot = await fetchSnapshot();

  return (
    <Suspense
      fallback={
        <div style={{ display: 'grid', placeItems: 'center', height: '100dvh' }}>
          <LoadingSpinner size={50} />
        </div>
      }
    >
      <NewTickerProvider initialSnapshot={snapshot}>{children}</NewTickerProvider>
    </Suspense>
  );
}
