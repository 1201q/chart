import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../entities/trading-order.entity';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  market!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['BUY', 'SELL'])
  side!: 'BUY' | 'SELL';

  @IsString()
  @IsNotEmpty()
  @IsIn(['LIMIT'])
  type!: 'LIMIT';

  @IsString()
  @IsNotEmpty()
  price!: string;

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
