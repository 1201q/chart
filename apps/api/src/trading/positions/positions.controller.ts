import { Controller, Get } from '@nestjs/common';
import { PositionsService } from './positions.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { TradingUser } from '../entities/trading-user.entity';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('positions')
export class PositionsController {
  constructor(private readonly positions: PositionsService) {}

  @Get()
  @ApiBearerAuth()
  getMyPositions(@CurrentUser() user: TradingUser) {
    return this.positions.getMyPositions(user.id);
  }
}
