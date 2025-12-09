import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UpbitModule } from './upbit/upbit.module';
import { MarketModule } from './market/market.module';

import { ScheduleModule } from '@nestjs/schedule';
import { RealtimeModule } from './realtime/realtime.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { typeOrmConfig } from './common/config/typeorm.config';
import { CandlesModule } from './candles/candles.module';
import { OracleBucketModule } from './bucket/oralce.bucket.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const typeormConfig = await typeOrmConfig(config);
        return typeormConfig;
      },
    }),
    ScheduleModule.forRoot(),
    UpbitModule,
    MarketModule,
    RealtimeModule,
    CandlesModule,
    OracleBucketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
