import { BadRequestException } from '@nestjs/common';

export function parseMarketCode(market: string) {
  const [currency, symbol] = market.split('-');
  if (!currency || !symbol) {
    throw new BadRequestException('Invalid market format');
  }

  return { currency: currency.toUpperCase(), symbol: symbol.toUpperCase() };
}
