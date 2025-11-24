import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UpbitCandle } from './candle.entity';

import { CandlesController } from './candles.controller';
import { CandlesService } from './candles.service';

@Module({
  imports: [TypeOrmModule.forFeature([UpbitCandle])],
  providers: [CandlesService],
  controllers: [CandlesController],
  exports: [TypeOrmModule],
})
export class CandlesModule {}
