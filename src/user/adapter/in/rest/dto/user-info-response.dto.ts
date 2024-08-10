import { ApiProperty } from '@nestjs/swagger';

export class UserInfoResponseDto {
  @ApiProperty({ description: '사용자 고유 ID' })
  id: string;

  @ApiProperty({ description: '사용자 이메일' })
  email: string;

  @ApiProperty({ description: '사용자 이름', nullable: true })
  firstName: string | null;

  @ApiProperty({ description: '사용자 성', nullable: true })
  lastName: string | null;

  @ApiProperty({
    description: '인증 제공자 (예: local, google)',
    nullable: true,
  })
  provider: string | null;

  @ApiProperty({ description: '제공자별 사용자 ID', nullable: true })
  providerId: string | null;

  @ApiProperty({ description: '프로필 사진 URL', nullable: true })
  profilePicture: string | null;

  @ApiProperty({ description: '일일 목표 칼로리', nullable: true })
  targetCalories: number | null;

  @ApiProperty({ description: '계정 생성 일시' })
  createdAt: Date;

  @ApiProperty({ description: '계정 정보 마지막 수정 일시' })
  updatedAt: Date;
}
