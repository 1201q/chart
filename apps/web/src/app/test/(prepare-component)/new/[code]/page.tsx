import NewMarketPageClient from '@/components/NewMarketPageClient';

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  return <NewMarketPageClient code={code} />;
}
