// src/user/adapter/in/rest/user.controller.ts

import { Controller, Get, Put, Body, UseGuards, Inject } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import {
  USER_USE_CASE,
  UserUseCase,
} from '@user/application/port/in/user.use-case';
import { User } from '@common/decorators/user.decorator';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { UpdateTargetCaloriesDto } from './dto/update-target-calories.dto';
import { UserInfoResponseDto } from './dto/user-info-response.dto';
import { UpdateTargetCaloriesResponseDto } from './dto/update-target-calories-response.dto';

@ApiTags('User')
@Controller('user')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(
    @Inject(USER_USE_CASE)
    private readonly userUseCase: UserUseCase,
  ) {}

  @Get('info')
  @ApiOperation({
    summary: '사용자 정보 조회',
    description: '현재 로그인한 사용자의 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '사용자 정보 조회 성공',
    type: UserInfoResponseDto,
  })
  @ApiUnauthorizedResponse({ description: '인증되지 않은 사용자' })
  @ApiInternalServerErrorResponse({ description: '서버 오류' })
  async getUserInfo(@User('id') userId: string): Promise<UserInfoResponseDto> {
    const user = await this.userUseCase.getUserInfo(userId);
    return {
      id: user.id,
      email: user.email,
      targetCalories: user.targetCalories,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  @Put('target-calories')
  @ApiOperation({
    summary: '목표 칼로리 수정',
    description: '사용자의 일일 목표 칼로리를 수정합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '목표 칼로리 수정 성공',
    type: UpdateTargetCaloriesResponseDto,
  })
  @ApiBadRequestResponse({
    description: '잘못된 요청 (예: 유효하지 않은 칼로리 값)',
  })
  @ApiUnauthorizedResponse({ description: '인증되지 않은 사용자' })
  @ApiInternalServerErrorResponse({ description: '서버 오류' })
  async updateTargetCalories(
    @User('id') userId: string,
    @Body() updateTargetCaloriesDto: UpdateTargetCaloriesDto,
  ): Promise<UpdateTargetCaloriesResponseDto> {
    const updatedUser = await this.userUseCase.updateTargetCalories(
      userId,
      updateTargetCaloriesDto.targetCalories,
    );
    return {
      message: 'Target calories updated successfully',
      targetCalories: updatedUser.targetCalories,
    };
  }
}
