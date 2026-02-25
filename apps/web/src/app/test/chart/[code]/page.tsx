import ChartTestClient from './_client';

export default async function ChartTestPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return <ChartTestClient code={code} />;
}
