import { Controller, Param, Post, BadRequestException } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { OrderbookStreamService } from 'src/realtime/orderbook/orderbook-stream.service';

@Controller('matching')
export class MatchingController {
  constructor(
    private readonly matching: MatchingService,
    private readonly orderbooks: OrderbookStreamService,
  ) {}

  @Post(':market/run')
  async run(@Param('market') market: string) {
    const code = market.toUpperCase();
    const snapshot = this.orderbooks.getSnapshotByCode(code);
    if (!snapshot) {
      throw new BadRequestException(`No orderbook snapshot for market ${code}`);
    }

    return this.matching.matchMarket(snapshot);
  }
}
