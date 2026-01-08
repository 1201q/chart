import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
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
  @IsIn(['pending', 'completed'])
  view?: 'pending' | 'completed';
}
