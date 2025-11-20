import { Module } from '@nestjs/common';

import { MarketService } from './market.service';
import { MarketSyncService } from './market.sync.service';
import { UpbitModule } from 'src/upbit/upbit.module';
import { MarketController } from './market.controller';

@Module({
  imports: [UpbitModule],
  providers: [MarketService, MarketSyncService],
  controllers: [MarketController],
  exports: [MarketService, MarketSyncService],
})
export class MarketModule {}
