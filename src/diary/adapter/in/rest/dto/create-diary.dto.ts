import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FoodBreakdown } from '@common/dto/Ingredient.dto';
import { Transform } from 'class-transformer';

export class CreateDiaryDto {
  @ApiProperty({ description: '일기 내용' })
  @IsString()
  content: string;

  @ApiProperty({
    description: '이미지 파일',
    type: 'string',
    format: 'binary',
    required: false,
  })
  @IsOptional()
  image?: Express.Multer.File;

  @ApiProperty({ description: '총 칼로리', required: false, type: Number })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        console.log(e, 'value: ', value);
        return value;
      }
    }
    return value;
  })
  totalCalories?: number;

  @ApiProperty({
    description: '칼로리 세부 정보',
    required: false,
    type: 'object',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        console.log(e, 'value: ', value);
        return value;
      }
    }
    return value;
  })
  calorieBreakdown?: FoodBreakdown;
}
