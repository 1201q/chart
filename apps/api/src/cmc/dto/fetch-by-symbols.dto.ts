import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class FetchBySymbolsDto {
  @ApiProperty({
    description: '조회할 코인 심볼 (쉼표로 구분)',
    example: 'BTC,ETH,XRP,DOGE,ADA',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  symbols: string;
}
