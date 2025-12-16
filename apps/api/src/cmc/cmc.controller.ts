import { Controller, Get } from '@nestjs/common';

import { CmcInfoService } from './cmc-info.service';
import { CmcInfoSyncService } from './cmc-info-sync.service';

@Controller('cmc')
export class CmcController {
  constructor(
    private readonly info: CmcInfoService,
    private readonly sync: CmcInfoSyncService,
  ) {}

  @Get()
  async getMarkets() {
    const res = await this.sync.syncAll();

    return res;
  }
}
