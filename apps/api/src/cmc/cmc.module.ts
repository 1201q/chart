import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MarketModule } from 'src/market/market.module';
import { CmcController } from './cmc.controller';
import { CmcInfoService } from './cmc-info.service';

@Module({
  imports: [ConfigModule, MarketModule],
  controllers: [CmcController],
  providers: [CmcInfoService],
  exports: [CmcInfoService],
})
export class CmcModule { }
