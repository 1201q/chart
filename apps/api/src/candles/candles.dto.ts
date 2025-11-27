import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetCandlesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(400)
  count?: number = 200;

  /**
   * iso 기준
   * 없으면 "DB에 저장된 최신 시점" 기준
   */
  @IsOptional()
  @IsString()
  to?: string;
}
