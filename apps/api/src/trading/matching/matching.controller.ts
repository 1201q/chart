import { Controller, Param, Post, BadRequestException, Query } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { OrderbookStreamService } from 'src/realtime/orderbook/orderbook-stream.service';
import { MOCK_ORDERBOOK, MOCK_ORDERBOOK_2 } from './mock.orderbook';

@Controller('matching')
export class MatchingController {
  constructor(
    private readonly matching: MatchingService,
    private readonly orderbooks: OrderbookStreamService,
  ) {}

  @Post(':market/run')
  async run(@Param('market') market: string, @Query('mock') mock?: string) {
    const code = market.toUpperCase();

    const snapshot =
      mock === '1'
        ? { ...MOCK_ORDERBOOK, code }
        : mock === '2'
          ? { ...MOCK_ORDERBOOK_2, code }
          : this.orderbooks.getSnapshotByCode(code);

    if (!snapshot) {
      throw new BadRequestException(`No orderbook snapshot for market ${code}`);
    }

    return this.matching.matchMarket(snapshot);
  }
}
