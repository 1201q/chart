import { Module } from '@nestjs/common';

import { MarketService } from './market.service';
import { MarketSyncService } from './market.sync.service';
import { UpbitModule } from 'src/upbit/upbit.module';
import { MarketController } from './market.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UpbitMarket } from './entities/upbit-market.entity';
import { CoinInfo } from './entities/coin-info.entity';

@Module({
  imports: [UpbitModule, TypeOrmModule.forFeature([UpbitMarket, CoinInfo])],
  providers: [MarketService, MarketSyncService],
  controllers: [MarketController],
  exports: [MarketService, MarketSyncService, TypeOrmModule],
})
export class MarketModule { }
