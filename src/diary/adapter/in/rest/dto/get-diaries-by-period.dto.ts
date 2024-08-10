import { IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetDiariesByPeriodDto {
  @IsNotEmpty()
  @IsDateString()
  @ApiProperty({ example: '2023-01-01' })
  startDate: string;

  @IsNotEmpty()
  @IsDateString()
  @ApiProperty({ example: '2023-12-31' })
  endDate: string;
}
