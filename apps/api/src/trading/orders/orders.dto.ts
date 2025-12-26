import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../entities/trading-order.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ example: 'KRW-DOGE' })
  @IsString()
  @IsNotEmpty()
  market!: string;

  @ApiProperty({ example: 'BUY', enum: ['BUY', 'SELL'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['BUY', 'SELL'])
  side!: 'BUY' | 'SELL';

  @ApiProperty({ example: 'LIMIT', enum: ['LIMIT'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['LIMIT'])
  type!: 'LIMIT';

  @ApiProperty({ example: '184' })
  @IsString()
  @IsNotEmpty()
  price!: string;

  @ApiProperty({ example: '1000' })
  @IsString()
  @IsNotEmpty()
  qty!: string;
}

export class GetOrdersQueryDto {
  @IsOptional()
  @IsString()
  market?: string;

  @IsOptional()
  @IsString()
  @IsIn(['OPEN', 'CANCELLED', 'FILLED'])
  status?: OrderStatus;
}
