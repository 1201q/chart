import { NewTickerProvider } from '@/components/provider/TickerProvider';
import { QueryProvider } from '@/components/provider/QueryProvider';
import { MarketTickerWithNamesMap } from '@chart/shared-types';

async function fetchSnapshot(): Promise<MarketTickerWithNamesMap> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickers/snapshot`, {
    cache: 'no-store',
  });

  return res.json();
}

export default async function ChartTestLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const snapshot = await fetchSnapshot();

  return (
    <QueryProvider>
      <NewTickerProvider initialSnapshot={snapshot}>{children}</NewTickerProvider>
    </QueryProvider>
  );
}
