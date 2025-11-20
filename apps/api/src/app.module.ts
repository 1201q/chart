import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UpbitModule } from './upbit/upbit.module';
import { MarketModule } from './market/market.module';

@Module({
  imports: [UpbitModule, MarketModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
