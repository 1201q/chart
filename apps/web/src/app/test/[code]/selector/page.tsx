'use client';

import { useTicker, useTickerSelector, useTickerSelector2 } from '@/hooks/tickers.hooks';
import { createKrwPriceFormatter } from '@/utils/formatting/price';

const Page = () => {
  return (
    <div>
      <Type1 />
      <Type2 />
      <Type3 />
    </div>
  );
};

const Type1 = () => {
  console.count('Type1 render');
  const ticker = useTicker('KRW-BTC')?.tradePrice || 0;

  const priceFormatter = createKrwPriceFormatter(ticker);

  return <div>{priceFormatter.formatPrice(ticker)}</div>;
};

const Type2 = () => {
  console.count('Type2 render');

  const ticker = useTickerSelector('KRW-BTC', (state) => state?.tradePrice || 0);

  const priceFormatter = createKrwPriceFormatter(ticker);

  return <div>{priceFormatter.formatPrice(ticker)}</div>;
};

const Type3 = () => {
  console.count('Type3 render');

  const ticker = useTickerSelector2('KRW-BTC', (state) => state?.tradePrice || 0);

  return <div>{ticker}</div>;
};

export default Page;
