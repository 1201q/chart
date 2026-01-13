import { MarketInfo as MarketInfoType } from '@chart/shared-types';
import { notFound } from 'next/navigation';
import MarketPageClient from '@/components/MarketPageClient';
import MarketOrderbook from '@/components/orderbook/MarketOrderbook';

const getMarkets = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/markets`);

  if (!res.ok) {
    return [];
  }

  const json = (await res.json()) as MarketInfoType[];

  const symbols = json.map((market) => market.code);

  return symbols;
};

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const markets = await getMarkets();

  // 유효한 심볼인지 검사
  if (!markets.includes(code)) {
    notFound();
  }

  return (
    <MarketPageClient code={code}>
      <MarketOrderbook code={code} />
    </MarketPageClient>
  );
}
