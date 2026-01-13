import { IsString, IsNotEmpty } from 'class-validator';

export class SetBalanceBodyDto {
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
