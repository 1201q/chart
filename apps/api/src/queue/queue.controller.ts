import { Controller, Get } from '@nestjs/common';

@Controller('queue')
export class QueueController {
  constructor() { }

  @Get()
  async getMarkets() {
    return null;
  }
}
