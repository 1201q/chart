import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class TranslateTestDto {
  @ApiProperty({
    description: '번역할 영문 텍스트',
    example:
      'Bitcoin is a decentralized digital currency that enables peer-to-peer transactions.',
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  text: string;
}
