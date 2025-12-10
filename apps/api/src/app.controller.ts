import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { OracleBucketService } from './bucket/oracle.bucket.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly oci: OracleBucketService,
  ) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
