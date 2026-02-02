import { TradingFillDto, TradingOrderDto } from '@chart/shared-types';

export type CompletedOrderWithFills = TradingOrderDto & {
  fills: TradingFillDto[];
};
