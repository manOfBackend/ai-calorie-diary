import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { FoodAnalysisDto } from './dto/food-analysis.dto';
import {
  UnauthorizedResponseDto,
  BadRequestResponseDto,
  InternalServerErrorResponseDto,
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
      description: '음식 이미지가 성공적으로 분석되었습니다.',
      schema: {
        type: 'object',
        properties: {
          ingredients: {
            type: 'array',
            items: { type: 'string' },
            example: ['rice', 'chicken', 'vegetables'],
          },
          totalCalories: { type: 'number', example: 500 },
          breakdown: {
            type: 'object',
            additionalProperties: { type: 'number' },
            example: { rice: 200, chicken: 250, vegetables: 50 },
          },
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