import NewTickerList from '@/components/coinList/NewTickerList';
import TickerList from '@/components/coinList/TickerList';

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  return (
    <>
      {/* <Suspense fallback={<div>Loading trade section...</div>}>
        <TestTradeSection code={code} />
      </Suspense> */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div
          style={{
            width: '100%',
            height: '100%',
            maxWidth: '1200px',
            minHeight: '600px',
          }}
        >
          <NewTickerList />
        </div>
        <div
          style={{
            width: '100%',
            height: '100%',
            maxWidth: '1200px',
            minHeight: '600px',
          }}
        >
          {/* <TickerList /> */}
        </div>
      </div>
    </>
  );
}
