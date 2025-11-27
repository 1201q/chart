import ExchangeHeader from '@/components/ExchangeHeader';
import MainHeader from '@/components/MainHeader';
import MarketChart from '@/components/MarketChart';
import MarketChartController from '@/components/MarketChartController';
import MarketTabs from '@/components/MarketTabs';
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
        <div style={{ display: 'flex', flex: 1, maxWidth: `calc(100dvw - 330px)` }}>
          <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
            <MarketTabs />
            <MarketChartController />
            <MarketChart code={code} timeframe="days" />
          </div>
          <div
            style={{
              width: '250px',
              borderLeft: '1px solid rgb(225, 228, 238)',
            }}
          >
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
