import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max } from 'class-validator';

export class UpdateTargetCaloriesDto {
  @ApiProperty({
    description: '설정할 목표 칼로리',
    minimum: 500,
    maximum: 10000,
    example: 2000,
  })
  @IsNumber()
  @Min(500, { message: '목표 칼로리는 최소 500 이상이어야 합니다.' })
  @Max(10000, { message: '목표 칼로리는 최대 10000 이하여야 합니다.' })
  targetCalories: number;
}
