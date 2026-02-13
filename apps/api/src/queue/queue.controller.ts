import { Controller, Get } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Roles('ADMIN')
@Controller('queue')
export class QueueController {
  constructor() {}

  @Get()
  async getMarkets() {
    return null;
  }
}
