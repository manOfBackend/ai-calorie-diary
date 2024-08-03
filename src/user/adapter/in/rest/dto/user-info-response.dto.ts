import { ApiProperty } from '@nestjs/swagger';

export class UserInfoResponseDto {
  @ApiProperty({ description: '사용자 고유 ID' })
  id: string;

  @ApiProperty({ description: '사용자 이메일' })
  email: string;

  @ApiProperty({ description: '일일 목표 칼로리', nullable: true })
  targetCalories: number | null;

  @ApiProperty({ description: '계정 생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: '계정 정보 마지막 수정 일시' })
  updatedAt: Date;
}
