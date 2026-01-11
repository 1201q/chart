import { Suspense } from 'react';
import TestTradeSection from './_components/TestTradeSection';

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  return (
    <>
      <Suspense fallback={<div>Loading trade section...</div>}>
        <TestTradeSection code={code} />
      </Suspense>
    </>
  );
}
