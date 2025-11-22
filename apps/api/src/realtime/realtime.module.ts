import { Module } from '@nestjs/common';
import { MarketModule } from 'src/market/market.module';
import { TickerStreamService } from './ticker-stream.service';

import { TickerController } from './ticker.controller';
import { UpbitModule } from 'src/upbit/upbit.module';

@Module({
  imports: [MarketModule, UpbitModule],
  providers: [TickerStreamService],
  controllers: [TickerController],
  exports: [TickerStreamService],
})
export class RealtimeModule {}
