import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UpbitModule } from './upbit/upbit.module';
import { MarketModule } from './market/market.module';

import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [UpbitModule, MarketModule, ScheduleModule.forRoot()],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
