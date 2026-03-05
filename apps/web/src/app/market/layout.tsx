import { TickerProvider } from '@/components/provider/TickerProvider';
import { TradingProvider } from '@/components/provider/TradingProvider';
import { MarketTickerWithNamesMap } from '@chart/shared-types';
import { getMe } from '@/utils/api/auth.api';
import { redirect } from 'next/navigation';

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
  const [snapshot, user] = await Promise.all([fetchSnapshot(), getMe()]);

  if (!user) redirect('/login');
  if (!user.isInitialized) redirect('/initialize');

  return (
    <TickerProvider initialSnapshot={snapshot}>
      <TradingProvider>{children}</TradingProvider>
    </TickerProvider>
  );
}
