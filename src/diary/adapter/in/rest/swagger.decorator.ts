// src/diary/adapter/in/rest/swagger.decorator.ts

import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateDiaryDto } from './dto/create-diary.dto';
import {
  BadRequestResponseDto,
  ForbiddenResponseDto,
  InternalServerErrorResponseDto,
  NotFoundResponseDto,
  UnauthorizedResponseDto,
} from '@common/dto/error-responses.dto';

export function SwaggerDiary(summary: string) {
  return applyDecorators(
    ApiOperation({ summary }),
    ApiResponse({
      status: 401,
      description: '인증되지 않음',
      type: UnauthorizedResponseDto,
    }),
    ApiResponse({
      status: 403,
      description: '접근 권한 없음',
      type: ForbiddenResponseDto,
    }),
    ApiResponse({
      status: 500,
      description: '서버 오류',
      type: InternalServerErrorResponseDto,
    }),
  );
}

const diaryResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
    content: {
      type: 'string',
      example:
        '오늘 점심으로 맛있는 비빔밥을 먹었다. 건강한 한식을 먹으니 기분이 좋아졌다.',
    },
    imageUrl: {
      type: 'string',
      example: 'https://example.com/images/bibimbap.jpg',
    },
    userId: { type: 'string', example: '98765432-10ab-cdef-ghij-klmnopqrstuv' },
    createdAt: {
      type: 'string',
      format: 'date-time',
      example: '2023-06-07T10:30:00Z',
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      example: '2023-06-07T10:30:00Z',
    },
    totalCalories: { type: 'number', example: 600 },
    calorieBreakdown: {
      type: 'object',
      example: {
        밥: {
          protein: { amount: 3, unit: 'g', calories: 12 },
          fat: { amount: 0.3, unit: 'g', calories: 2.7 },
          carbohydrate: { amount: 28, unit: 'g', calories: 112 },
        },
        소고기: {
          protein: { amount: 20, unit: 'g', calories: 80 },
          fat: { amount: 15, unit: 'g', calories: 135 },
          carbohydrate: { amount: 0, unit: 'g', calories: 0 },
        },
        계란: {
          protein: { amount: 6, unit: 'g', calories: 24 },
          fat: { amount: 5, unit: 'g', calories: 45 },
          carbohydrate: { amount: 0.6, unit: 'g', calories: 2.4 },
        },
        야채: {
          protein: { amount: 2, unit: 'g', calories: 8 },
          fat: { amount: 0.5, unit: 'g', calories: 4.5 },
          carbohydrate: { amount: 5, unit: 'g', calories: 20 },
        },
        고추장: {
          protein: { amount: 2, unit: 'g', calories: 8 },
          fat: { amount: 1, unit: 'g', calories: 9 },
          carbohydrate: { amount: 10, unit: 'g', calories: 40 },
        },
      },
    },
  },
};

export function SwaggerCreateDiary() {
  return applyDecorators(
    ApiConsumes('multipart/form-data'),
    ApiBody({
      type: CreateDiaryDto,
      schema: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            example: '오늘 점심으로 맛있는 비빔밥을 먹었다.',
          },
          image: { type: 'string', format: 'binary' },
          totalCalories: { type: 'number', example: 600 },
          calorieBreakdown: {
            type: 'string',
            example: JSON.stringify({
              밥: {
                protein: { amount: 3, unit: 'g', calories: 12 },
                fat: { amount: 0.3, unit: 'g', calories: 2.7 },
                carbohydrate: { amount: 28, unit: 'g', calories: 112 },
              },
              소고기: {
                protein: { amount: 20, unit: 'g', calories: 80 },
                fat: { amount: 15, unit: 'g', calories: 135 },
                carbohydrate: { amount: 0, unit: 'g', calories: 0 },
              },
            }),
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: '일기가 성공적으로 작성되었습니다.',
      schema: diaryResponseSchema,
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
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: '일기를 성공적으로 조회했습니다.',
      schema: diaryResponseSchema,
    }),
    ApiResponse({
      status: 404,
      description: '일기를 찾을 수 없음',
      type: NotFoundResponseDto,
    }),
  );
}

export function SwaggerGetUserDiaries() {
  return applyDecorators(
    ApiResponse({
      status: 200,
      description: '사용자의 모든 일기를 성공적으로 조회했습니다.',
      schema: {
        type: 'array',
        items: diaryResponseSchema,
      },
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
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiBody({
      type: CreateDiaryDto,
      schema: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            example:
              '오늘 점심으로 맛있는 비빔밥을 먹었다. 저녁에는 가벼운 운동도 했다.',
          },
          image: { type: 'string', format: 'binary' },
          totalCalories: { type: 'number', example: 600 },
          calorieBreakdown: {
            type: 'string',
            example: JSON.stringify({
              밥: {
                protein: { amount: 3, unit: 'g', calories: 12 },
                fat: { amount: 0.3, unit: 'g', calories: 2.7 },
                carbohydrate: { amount: 28, unit: 'g', calories: 112 },
              },
              소고기: {
                protein: { amount: 20, unit: 'g', calories: 80 },
                fat: { amount: 15, unit: 'g', calories: 135 },
                carbohydrate: { amount: 0, unit: 'g', calories: 0 },
              },
            }),
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: '일기가 성공적으로 수정되었습니다.',
      schema: diaryResponseSchema,
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
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: '일기가 성공적으로 삭제되었습니다.',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Diary successfully deleted' },
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

export function SwaggerGetDiariesByPeriod() {
  return applyDecorators(
    ApiOperation({ summary: '특정 기간의 일기 조회' }),
    ApiQuery({
      name: 'startDate',
      required: true,
      type: String,
      example: '2023-01-01',
    }),
    ApiQuery({
      name: 'endDate',
      required: true,
      type: String,
      example: '2023-12-31',
    }),
    ApiResponse({
      status: 200,
      description: '특정 기간의 일기를 성공적으로 조회했습니다.',
      schema: {
        type: 'array',
        items: diaryResponseSchema,
      },
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청',
      type: BadRequestResponseDto,
    }),
  );
}
