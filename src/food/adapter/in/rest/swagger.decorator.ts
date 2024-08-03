// src/food/adapter/in/rest/swagger.decorator.ts

import { applyDecorators } from '@nestjs/common';
import {
  ApiResponse,
  ApiBody,
  ApiConsumes,
  ApiOperation,
} from '@nestjs/swagger';
import { FoodAnalysisDto } from './dto/food-analysis.dto';
import {
  InternalServerErrorResponseDto,
  UnauthorizedResponseDto,
} from '@common/dto/error-responses.dto';

export function SwaggerFood(summary: string) {
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

export function SwaggerAnalyzeFoodImage() {
  return applyDecorators(
    ApiConsumes('multipart/form-data'),
    ApiBody({ type: FoodAnalysisDto }),
    ApiResponse({
      status: 201,
      description: '음식 이미지 분석 결과',
      schema: {
        type: 'object',
        properties: {
          ingredients: {
            type: 'array',
            items: { type: 'string' },
            example: ['chicken', 'rice', 'broccoli'],
          },
          totalCalories: { type: 'number', example: 500 },
          breakdown: {
            type: 'object',
            additionalProperties: {
              type: 'object',
              properties: {
                protein: {
                  type: 'object',
                  properties: {
                    amount: { type: 'number' },
                    unit: { type: 'string', example: 'g' },
                    calories: { type: 'number' },
                  },
                },
                fat: {
                  type: 'object',
                  properties: {
                    amount: { type: 'number' },
                    unit: { type: 'string', example: 'g' },
                    calories: { type: 'number' },
                  },
                },
                carbohydrate: {
                  type: 'object',
                  properties: {
                    amount: { type: 'number' },
                    unit: { type: 'string', example: 'g' },
                    calories: { type: 'number' },
                  },
                },
              },
            },
            example: {
              chicken: {
                protein: { amount: 25, unit: 'g', calories: 100 },
                fat: { amount: 3, unit: 'g', calories: 27 },
                carbohydrate: { amount: 0, unit: 'g', calories: 0 },
              },
              rice: {
                protein: { amount: 4, unit: 'g', calories: 16 },
                fat: { amount: 0.5, unit: 'g', calories: 4.5 },
                carbohydrate: { amount: 45, unit: 'g', calories: 180 },
              },
            },
          },
        },
      },
    }),
  );
}
