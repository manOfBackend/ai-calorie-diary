// src/common/dto/error-responses.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { ErrorResponseDto } from './error-response.dto';

export class UnauthorizedResponseDto extends ErrorResponseDto {
  @ApiProperty({ example: 401 })
  statusCode: number;

  @ApiProperty({ example: 'Unauthorized' })
  error: string;

  @ApiProperty({ example: 'User not authenticated' })
  message: string;

  @ApiProperty({ example: 'UNAUTHORIZED' })
  errorCode: string;
}

export class NotFoundResponseDto extends ErrorResponseDto {
  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({ example: 'Not Found' })
  error: string;

  @ApiProperty({ example: 'Diary not found' })
  message: string;

  @ApiProperty({ example: 'NOT_FOUND' })
  errorCode: string;
}

export class BadRequestResponseDto extends ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request' })
  error: string;

  @ApiProperty({ example: 'Content should not be empty' })
  message: string;

  @ApiProperty({ example: 'INVALID_INPUT' })
  errorCode: string;
}

export class InternalServerErrorResponseDto extends ErrorResponseDto {
  @ApiProperty({ example: 500 })
  statusCode: number;

  @ApiProperty({ example: 'Internal Server Error' })
  error: string;

  @ApiProperty({ example: 'An unexpected error occurred' })
  message: string;

  @ApiProperty({ example: 'SERVER_ERROR' })
  errorCode: string;
}
