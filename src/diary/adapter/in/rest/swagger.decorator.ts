// src/diary/adapter/in/rest/swagger.decorator.ts

import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { CreateDiaryDto } from './dto/create-diary.dto';
import {
  UnauthorizedResponseDto,
  NotFoundResponseDto,
  BadRequestResponseDto,
  InternalServerErrorResponseDto,
} from '../../../../common/dto/error-responses.dto';

export function SwaggerDiary(summary: string) {
  return applyDecorators(
    ApiOperation({ summary }),
    ApiResponse({
      status: 401,
      description: '인증되지 않음',
      type: UnauthorizedResponseDto,
    }),
    ApiResponse({
      status: 500,
      description: '서버 오류',
      type: InternalServerErrorResponseDto,
    }),
  );
}

export function SwaggerCreateDiary() {
  return applyDecorators(
    ApiConsumes('multipart/form-data'),
    ApiBody({ type: CreateDiaryDto }),
    ApiResponse({
      status: 201,
      description: '일기가 성공적으로 작성되었습니다.',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '1234567890' },
          content: {
            type: 'string',
            example: '오늘은 정말 좋은 날이었습니다...',
          },
          imageUrl: {
            type: 'string',
            example: 'https://example.com/images/1234567890.jpg',
          },
          userId: { type: 'string', example: '0987654321' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청',
      type: BadRequestResponseDto,
    }),
  );
}

export function SwaggerGetDiary() {
  return applyDecorators(
    ApiParam({
      name: 'id',
      required: true,
      description: '조회할 일기의 ID',
      schema: { type: 'string' },
      example: '1234567890',
    }),
    ApiResponse({
      status: 200,
      description: '일기를 성공적으로 조회했습니다.',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '1234567890' },
          content: {
            type: 'string',
            example: '오늘은 정말 좋은 날이었습니다...',
          },
          imageUrl: {
            type: 'string',
            example: 'https://example.com/images/1234567890.jpg',
          },
          userId: { type: 'string', example: '0987654321' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: '일기를 찾을 수 없음',
      type: NotFoundResponseDto,
    }),
  );
}

export function SwaggerUpdateDiary() {
  return applyDecorators(
    ApiConsumes('multipart/form-data'),
    ApiParam({
      name: 'id',
      required: true,
      description: '수정할 일기의 ID',
      schema: { type: 'string' },
      example: '1234567890',
    }),
    ApiBody({ type: CreateDiaryDto }),
    ApiResponse({
      status: 200,
      description: '일기가 성공적으로 수정되었습니다.',
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청',
      type: BadRequestResponseDto,
    }),
    ApiResponse({
      status: 404,
      description: '일기를 찾을 수 없음',
      type: NotFoundResponseDto,
    }),
  );
}

export function SwaggerDeleteDiary() {
  return applyDecorators(
    ApiParam({
      name: 'id',
      required: true,
      description: '삭제할 일기의 ID',
      schema: { type: 'string' },
      example: '1234567890',
    }),
    ApiResponse({
      status: 200,
      description: '일기가 성공적으로 삭제되었습니다.',
    }),
    ApiResponse({
      status: 404,
      description: '일기를 찾을 수 없음',
      type: NotFoundResponseDto,
    }),
  );
}
