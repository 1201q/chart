import { Module } from '@nestjs/common';
import { OracleBucketService } from './oracle.bucket.service';

@Module({
  imports: [],
  providers: [OracleBucketService],
  exports: [OracleBucketService],
})
export class OracleBucketModule { }
