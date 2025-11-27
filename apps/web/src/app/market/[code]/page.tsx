import ExchangeHeader from '@/components/ExchangeHeader';
import MainHeader from '@/components/MainHeader';
import SideCoinList from '@/components/SideCoinList';

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  return (
    <div style={{ display: 'flex', height: '100dvh' }}>
      <div
        style={{
          flex: 1,
          backgroundColor: '#f2f4f6',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <MainHeader />
        <ExchangeHeader code={code} />
        <div style={{ display: 'flex', flex: 1 }}>
          <div style={{ flex: 1 }}>1</div>
          <div style={{ width: '250px', borderLeft: '1px solid rgb(225, 228, 238)' }}>
            오더
          </div>
        </div>
      </div>

      <div style={{ borderLeft: '1px solid rgb(225, 228, 238)' }}>
        <SideCoinList />
      </div>
    </div>
  );
}
