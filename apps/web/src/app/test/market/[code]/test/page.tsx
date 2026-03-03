import MarketContent from '../MarketContent';

export default async function TestMarketPageNoSuspense({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <MarketContent code={code} />;
}
