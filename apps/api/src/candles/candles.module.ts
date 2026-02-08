import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UpbitCandle } from './candle.entity';
import { Candle240mFinalized } from './candle-240m-finalized.entity';

import { CandlesController } from './candles.controller';
import { CandlesService } from './candles.service';
import { UpbitModule } from 'src/upbit/upbit.module';

@Module({
  imports: [UpbitModule, TypeOrmModule.forFeature([UpbitCandle, Candle240mFinalized])],
  providers: [CandlesService],
  controllers: [CandlesController],
  exports: [TypeOrmModule],
})
export class CandlesModule {}
