import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateOrderBody, GetOrdersQuery } from '@chart/shared-types';

export class CreateOrderBodyDto implements CreateOrderBody {
  @ApiProperty({ example: 'KRW-DOGE' })
  @IsString()
  @IsNotEmpty()
  market!: string;

  @ApiProperty({ example: 'BUY', enum: ['BUY', 'SELL'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['BUY', 'SELL'])
  side!: 'BUY' | 'SELL';

  @ApiProperty({ example: 'LIMIT', enum: ['LIMIT', 'MARKET'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['LIMIT', 'MARKET'])
  type!: 'LIMIT' | 'MARKET';

  /**
   * 주문할 가격 : 지정가 주문시에만 사용해야함.
   */
  @ApiProperty({ example: '184' })
  @IsString()
  @IsOptional()
  price?: string;

  /**
   * 주문할 수량
   * - 지정가 주문 : 필수
   * - 시장가 매수 : x
   * - 시장가 매도 : 필수
   */
  @ApiProperty({ example: '1000' })
  @IsString()
  @IsOptional()
  qty?: string;

  /**
   * 총 사용 금액 (시장가 매수에서만 사용)
   */
  @IsString()
  @IsOptional()
  totalAmount?: string;
}

export class GetOrdersQueryDto implements GetOrdersQuery {
  @IsOptional()
  @IsString()
  market?: string;

  @IsOptional()
  @IsIn(['pending', 'completed'])
  view?: 'pending' | 'completed';
}
