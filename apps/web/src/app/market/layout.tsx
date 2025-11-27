import { TickerProvider } from '@/components/TickerProvider';
import { MarketTickerWithNamesMap } from '@chart/shared-types';

async function fetchSnapshot(): Promise<MarketTickerWithNamesMap> {
  const res = await fetch('http://localhost:8000/tickers/snapshot', {
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

  return <TickerProvider initialSnapshot={snapshot}>{children}</TickerProvider>;
}
