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
    ApiBody({
      description: '음식 이미지 분석을 위한 요청',
      type: FoodAnalysisDto,
      schema: {
        type: 'object',
        properties: {
          image: {
            type: 'string',
            format: 'binary',
            description: '분석할 음식 이미지 (최대 5MB)',
          },
          description: {
            type: 'string',
            description: '음식에 대한 추가 설명',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: '음식 이미지 분석 결과',
      schema: {
        type: 'object',
        properties: {
          ingredients: {
            type: 'array',
            items: { type: 'string' },
            description: '식별된 재료 목록',
          },
          totalCalories: {
            type: 'number',
            description: '총 칼로리',
          },
          breakdown: {
            type: 'object',
            additionalProperties: { type: 'number' },
            description: '재료별 칼로리 분석',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: '잘못된 요청 (예: 파일 크기 초과)',
    }),
  );
}
