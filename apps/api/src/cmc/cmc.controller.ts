import { Controller, Get } from '@nestjs/common';

import { CmcInfoService } from './cmc-info.service';

@Controller('cmc')
export class CmcController {
  constructor(private readonly sync: CmcInfoService) { }

  @Get()
  async getMarkets() {
    const res = await this.sync.test();

    return res;
  }
}
