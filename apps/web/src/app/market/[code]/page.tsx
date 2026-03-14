import { Suspense } from 'react';
import MarketContent from './MarketContent';
import MarketPageSkeleton from '@/components/testMarket/MarketPageSkeleton';

export default async function MarketPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <Suspense fallback={<MarketPageSkeleton />}>
      <MarketContent code={code} />
    </Suspense>
  );
}
