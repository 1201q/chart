import { Suspense } from 'react';
import MarketContent from './MarketContent';
import MarketPageSkeleton from '@/components/testMarket/MarketPageSkeleton';
import SuspenseMark from '@/components/profiler/SuspenseMark';

export default async function MarketPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <Suspense fallback={<SuspenseMark name="market-content"><MarketPageSkeleton /></SuspenseMark>}>
      <MarketContent code={code} />
    </Suspense>
  );
}
