import MarketPageClient from '@/components/MarketPageClient';
import MarketOrderbook from '@/components/orderbook/MarketOrderbook';

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  return (
    <MarketPageClient code={code}>
      <MarketOrderbook code={code} />
    </MarketPageClient>
  );
}
