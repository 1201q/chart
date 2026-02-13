import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
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
import { CmcModule } from './cmc/cmc.module';
import { GeminiModule } from './cmc/gemini.module';
import { QueueModule } from './queue/queue.module';
import { TradingModule } from './trading/trading.module';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './common/redis/redis.module';
import { JwtGuard } from './auth/guards/jwt.guard';
import { RolesGuard } from './auth/guards/roles.guard';

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
    RedisModule, // Global module - REDIS_CLIENT 전역 제공
    GeminiModule, // Global module - 순환 참조 방지
    UpbitModule,
    MarketModule,
    RealtimeModule,
    CandlesModule,
    OracleBucketModule,
    CmcModule,
    QueueModule,
    TradingModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 전역 가드로 모든 엔드포인트에 JWT 인증 적용
    { provide: APP_GUARD, useClass: JwtGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
