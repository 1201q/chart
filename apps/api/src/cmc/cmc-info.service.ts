import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MarketService } from 'src/market/market.service';

@Injectable()
export class CmcInfoService {
  private readonly logger = new Logger(CmcInfoService.name);
  private readonly baseUrl = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/info`;

  constructor(
    private readonly configService: ConfigService,
    private readonly marketService: MarketService,
  ) { }
}
