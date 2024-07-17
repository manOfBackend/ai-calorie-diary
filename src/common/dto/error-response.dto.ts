// src/common/dto/error-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request' })
  error: string;

  @ApiProperty({ example: 'Invalid input data' })
  message: string;

  @ApiProperty({ example: 'INVALID_INPUT' })
  errorCode: string;

  @ApiProperty({ example: '2023-05-20T12:34:56.789Z' })
  timestamp: string;

  @ApiProperty({ example: '/auth/login' })
  path: string;
}
