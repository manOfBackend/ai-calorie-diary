import { ApiProperty } from '@nestjs/swagger';

export class UpdateTargetCaloriesResponseDto {
  @ApiProperty({ description: '업데이트 성공 메시지' })
  message: string;

  @ApiProperty({ description: '업데이트된 목표 칼로리' })
  targetCalories: number;
}
