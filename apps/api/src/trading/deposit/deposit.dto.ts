import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DEPOSIT_AMOUNTS, DepositAmount } from './deposit.constants';

export class DepositBodyDto {
  @ApiProperty({
    description: '입금액 (1천만 / 3천만 / 5천만 / 1억)',
    enum: DEPOSIT_AMOUNTS,
    example: 10_000_000,
  })
  @IsIn(DEPOSIT_AMOUNTS)
  amount!: DepositAmount;
}

export class InitializeBalanceBodyDto {
  @ApiProperty({
    description: '초기 원화 설정액 (1천만 / 3천만 / 5천만 / 1억)',
    enum: DEPOSIT_AMOUNTS,
    example: 10_000_000,
  })
  @IsIn(DEPOSIT_AMOUNTS)
  amount!: DepositAmount;
}
