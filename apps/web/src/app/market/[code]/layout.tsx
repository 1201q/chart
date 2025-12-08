import { TradeProvider } from '@/components/provider/TradeProvider';
import { MarketTradeWithId } from '@chart/shared-types';

async function fetchTradeSnapshot(code: string): Promise<MarketTradeWithId[]> {
  const res = await fetch(`http://localhost:8000/trades/${code}`, {
    cache: 'no-store',
  });
  return res.json();
}

export default async function MarketLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ code: string }>;
}>) {
  const { code } = await params;

  const snapshot = await fetchTradeSnapshot(code);

  return (
    <TradeProvider code={code} initialSnapshot={snapshot}>
      {children}
    </TradeProvider>
  );
}
