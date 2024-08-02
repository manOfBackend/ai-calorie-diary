import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FoodAnalysisDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: '분석할 음식 이미지 파일',
  })
  @IsOptional()
  image?: Express.Multer.File;

  @ApiProperty({
    type: 'string',
    description: '음식에 대한 추가 설명',
    example: '오늘 점심으로 먹은 치킨 샐러드입니다.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}
