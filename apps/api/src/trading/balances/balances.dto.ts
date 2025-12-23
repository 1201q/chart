import { IsString, IsNotEmpty } from 'class-validator';

export class SetBalanceDto {
  @IsString()
  @IsNotEmpty()
  currency!: string;

  @IsString()
  @IsNotEmpty()
  available!: string;

  @IsString()
  @IsNotEmpty()
  locked!: string;
}
