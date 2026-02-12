import { Controller, Get, Query } from '@nestjs/common';
import { FillsService } from './fills.service';
import { GetFillsQueryDto } from './fills.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { TradingUser } from '../entities/trading-user.entity';

@Controller('fills')
export class FillsController {
  constructor(private readonly fills: FillsService) {}

  @Get()
  getMyFills(@Query() query: GetFillsQueryDto, @CurrentUser() user: TradingUser) {
    return this.fills.getMyFills(query, user.id);
  }
}
