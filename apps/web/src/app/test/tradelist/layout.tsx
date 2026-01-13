import { NewTickerProvider } from '@/components/provider/NewTickerProvider';

import { MarketTickerWithNamesMap } from '@chart/shared-types';

async function fetchTickerSnapshot(): Promise<MarketTickerWithNamesMap> {
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
  const snapshot = await fetchTickerSnapshot();

  return <NewTickerProvider initialSnapshot={snapshot}>{children}</NewTickerProvider>;
}
