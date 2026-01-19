import NewMarketPageClient from '@/components/NewMarketPageClient';

import { Tab } from '@/types/tabs.types';

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { code } = await params;
  const { tab } = await searchParams;

  const initialTab = (tab as Tab) ?? 'chart';

  return <NewMarketPageClient code={code} initialTab={initialTab} />;
}
