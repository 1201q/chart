import { Module } from '@nestjs/common';
import { MarketModule } from 'src/market/market.module';
import { TickerStreamService } from './ticker-stream.service';

import { TickerController } from './ticker.controller';
import { UpbitModule } from 'src/upbit/upbit.module';
import { TradeStreamService } from './trade-stream.service';
import { TradeController } from './trade.controller';
import { OrderbookStreamService } from './orderbook-stream.service';
import { OrderbookController } from './orderbook.controller';

@Module({
  imports: [MarketModule, UpbitModule],
  providers: [TickerStreamService, TradeStreamService, OrderbookStreamService],
  controllers: [TickerController, TradeController, OrderbookController],
  exports: [TickerStreamService, TradeStreamService, OrderbookStreamService],
})
export class RealtimeModule {}
