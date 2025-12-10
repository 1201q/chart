import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import test from './test.json';

type CoinTagType = {
  tag: string;
  name: string;
  group: string;
};

@Injectable()
export class MarketInfoService {
  private tags = new Map<string, CoinTagType>();

  constructor(private readonly configService: ConfigService) { }

  getMarketInfo() {
    const data = Object.values(test.data);

    return 1;
  }
}
