import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CmcController } from './cmc.controller';
import { CmcInfoService } from './cmc-info.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UpbitMarket } from 'src/market/entities/upbit-market.entity';
import { CoinInfo } from 'src/market/entities/coin-info.entity';
import { CmcInfoSyncService } from './cmc-info-sync.service';
import { QueueModule } from 'src/queue/queue.module';

@Module({
  imports: [ConfigModule, QueueModule, TypeOrmModule.forFeature([UpbitMarket, CoinInfo])],
  controllers: [CmcController],
  providers: [CmcInfoService, CmcInfoSyncService],
  exports: [CmcInfoService],
})
export class CmcModule {}
