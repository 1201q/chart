import {
  MarketTickerWithNamesMap,
  TradingBalanceDto,
  TradingPositionDto,
} from '@chart/shared-types';
import styles from './layout.module.css';
import AssetInfoPage from '@/components/account/AssetInfoPage';

async function fetchBalances(): Promise<{
  ok: boolean;
  balances: TradingBalanceDto[];
}> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/balances`, {
    cache: 'no-store',
  });

  return res.json();
}

async function fetchPositions(): Promise<{
  ok: boolean;
  positions: TradingPositionDto[];
}> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/positions`, {
    cache: 'no-store',
  });

  return res.json();
}

async function fetchSnapshot(): Promise<MarketTickerWithNamesMap> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickers/snapshot`, {
    cache: 'no-store',
  });

  return res.json();
}

const Layout = async () => {
  const { balances } = await fetchBalances();
  const { positions } = await fetchPositions();
  const snapshot = await fetchSnapshot();

  return (
    <div className={styles.wrapper}>
      <AssetInfoPage balances={balances} positions={positions} snapshot={snapshot} />
    </div>
  );
};

export default Layout;
