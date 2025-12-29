import { IsOptional, IsString } from 'class-validator';

export class GetFillsQueryDto {
  @IsOptional()
  @IsString()
  market?: string;

  @IsOptional()
  @IsString()
  orderId?: string;
}
