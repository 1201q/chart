import { Controller, Post, ForbiddenException } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Roles('ADMIN')
@Controller('trading')
export class TradingTestController {
  @Post('reset-all')
  async resetAll() {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('reset-all is disabled in production');
    }
    return null;
  }
}
