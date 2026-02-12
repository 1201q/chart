import { Body, Controller, Get, Post } from '@nestjs/common';
import { BalancesService } from './balances.service';
import { SetBalanceBodyDto } from './balances.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { TradingUser } from '../entities/trading-user.entity';

@Controller('balances')
export class BalancesController {
  constructor(private readonly balances: BalancesService) {}

  @Get()
  getBalances(@CurrentUser() user: TradingUser) {
    return this.balances.getMyBalances(user.id);
  }

  // 특정 통화 잔고 직접 설정 - Admin 전용
  @Post('set')
  @Roles('ADMIN')
  setBalance(@Body() dto: SetBalanceBodyDto, @CurrentUser() user: TradingUser) {
    return this.balances.setBalance(dto, user.id);
  }

  // 잔고 초기화 (1억 KRW) - 본인만
  @Post('reset')
  resetBalances(@CurrentUser() user: TradingUser) {
    return this.balances.resetBalances(user.id);
  }
}
