import { NewTradeProvider } from '@/components/provider/NewTradeProvider';
import { MarketTradeWithId } from '@chart/shared-types';
import TestTradeSectionClient from './TestTradeSectionClient';

async function fetchTradeSnapshot(code: string): Promise<MarketTradeWithId[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/trades/${code}`, {
    cache: 'no-store',
  });
  return res.json();
}

export default async function TestTradeSection({ code }: { code: string }) {
  const snapshot = await fetchTradeSnapshot(code);

  await new Promise((resolve) => setTimeout(resolve, 2000));

  return (
    <NewTradeProvider key={code} code={code} initialSnapshot={snapshot}>
      <TestTradeSectionClient />
    </NewTradeProvider>
  );
}
