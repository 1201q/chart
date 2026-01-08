import { Body, Controller, Get, Post } from '@nestjs/common';
import { BalancesService } from './balances.service';
import { SetBalanceBodyDto } from './balances.dto';

@Controller('balances')
export class BalancesController {
  constructor(private readonly balances: BalancesService) {}

  @Get()
  getBalances() {
    return this.balances.getMyBalances();
  }

  @Post('set')
  setBalance(@Body() dto: SetBalanceBodyDto) {
    return this.balances.setBalance(dto);
  }

  @Post('reset')
  resetBalances() {
    return this.balances.resetBalances();
  }
}
