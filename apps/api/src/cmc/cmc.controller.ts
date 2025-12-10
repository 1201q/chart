import { Controller, Get } from '@nestjs/common';
import { CmcInfoService } from './cmc-info.service';

@Controller('cmc')
export class CmcController {
  constructor(private readonly cmcInfoService: CmcInfoService) { }

  @Get()
  async getMarkets() {
    return null;
  }
}
