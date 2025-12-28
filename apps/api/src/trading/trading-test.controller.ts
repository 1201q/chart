import { Controller, Post, ForbiddenException } from '@nestjs/common';

import { TradingTestService } from './trading.test.service';

@Controller('trading')
export class TradingTestController {
  constructor(private readonly testService: TradingTestService) {}

  @Post('reset-all')
  async resetAll() {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('reset-all is disabled in production');
    }

    return null;
  }
}
