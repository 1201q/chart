import { Module } from '@nestjs/common';
import { UpbitHttpService } from './upbit.http.service';

@Module({
  providers: [UpbitHttpService],
  exports: [UpbitHttpService],
})
export class UpbitModule {}
