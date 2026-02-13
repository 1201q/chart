import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { DepositService } from './deposit.service';
import { DepositBodyDto, InitializeBalanceBodyDto } from './deposit.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { TradingUser } from '../entities/trading-user.entity';

@ApiTags('Deposit')
@ApiBearerAuth()
@Controller()
export class DepositController {
  constructor(private readonly depositService: DepositService) {}

  // ─────────────────────────────────────────────
  // 초기 원화 설정 (1회성)
  // ─────────────────────────────────────────────
  @Post('balances/initialize')
  @ApiOperation({
    summary: '초기 원화 설정 (최초 1회)',
    description: '회원가입 후 최초 1회만 가능합니다. 이후 입금은 /deposit을 사용하세요.',
  })
  @ApiResponse({
    status: 200,
    schema: { example: { ok: true, amount: 10000000 } },
  })
  @ApiResponse({ status: 409, description: '이미 초기 설정 완료된 계정' })
  initialize(@CurrentUser() user: TradingUser, @Body() dto: InitializeBalanceBodyDto) {
    return this.depositService.initialize(user.id, dto);
  }

  // ─────────────────────────────────────────────
  // 원화 입금 (월 3회 제한)
  // ─────────────────────────────────────────────
  @Post('deposit')
  @ApiOperation({
    summary: '원화 입금 (월 3회 제한)',
    description: '매월 최대 3회까지 입금 가능합니다.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: { ok: true, amount: 10000000, depositMonth: '2026-02', remaining: 2 },
    },
  })
  @ApiResponse({ status: 400, description: '월 입금 한도 초과 또는 초기 설정 미완료' })
  deposit(@CurrentUser() user: TradingUser, @Body() dto: DepositBodyDto) {
    return this.depositService.deposit(user.id, dto);
  }

  // ─────────────────────────────────────────────
  // 이번달 입금 현황
  // ─────────────────────────────────────────────
  @Get('deposit/status')
  @ApiOperation({ summary: '이번달 입금 현황 (남은 횟수 등)' })
  @ApiResponse({
    status: 200,
    schema: {
      example: { depositMonth: '2026-02', used: 1, remaining: 2, limit: 3 },
    },
  })
  getStatus(@CurrentUser() user: TradingUser) {
    return this.depositService.getStatus(user.id);
  }

  // ─────────────────────────────────────────────
  // 전체 입금 이력
  // ─────────────────────────────────────────────
  @Get('deposit/history')
  @ApiOperation({ summary: '전체 입금 이력' })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        ok: true,
        history: [
          { id: 'uuid', amount: 10000000, depositMonth: '2026-02', createdAt: '...' },
        ],
      },
    },
  })
  getHistory(@CurrentUser() user: TradingUser) {
    return this.depositService.getHistory(user.id);
  }
}
