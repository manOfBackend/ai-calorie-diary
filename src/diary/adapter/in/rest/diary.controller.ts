import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  Inject,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import {
  DIARY_USE_CASE,
  DiaryUseCase,
} from '../../../application/port/in/diary.use-case';
import { CreateDiaryDto } from './dto/create-diary.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';

@ApiTags('diary')
@Controller('diary')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DiaryController {
  constructor(
    @Inject(DIARY_USE_CASE)
    private readonly diaryUseCase: DiaryUseCase,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({
    summary: '일기 작성',
    description:
      '새로운 일기를 작성합니다. 텍스트 내용과 선택적으로 이미지를 포함할 수 있습니다.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateDiaryDto,
    description: '일기 작성에 필요한 데이터',
  })
  @ApiCreatedResponse({
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
  })
  @ApiUnauthorizedResponse({ description: '사용자가 인증되지 않았습니다.' })
  async createDiary(
    @Body() createDiaryDto: CreateDiaryDto,
    @UploadedFile() image: Express.Multer.File,
    @Request() req,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userId = req.user.id;
    return this.diaryUseCase.createDiary(createDiaryDto.content, image, userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: '특정 일기 조회',
    description: '지정된 ID의 일기를 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: '조회할 일기의 ID',
    schema: { type: 'string' },
  })
  @ApiOkResponse({
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
  })
  @ApiUnauthorizedResponse({ description: '사용자가 인증되지 않았습니다.' })
  @ApiNotFoundResponse({ description: '지정된 ID의 일기를 찾을 수 없습니다.' })
  async getDiary(@Param('id') id: string, @Request() req) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const diary = await this.diaryUseCase.getDiaryById(id);
    if (!diary) {
      throw new NotFoundException('Diary not found');
    }
    if (diary.userId !== req.user.id) {
      throw new UnauthorizedException(
        'You are not authorized to view this diary',
      );
    }
    return diary;
  }

  @Get()
  @ApiOperation({
    summary: '사용자의 모든 일기 조회',
    description: '현재 인증된 사용자의 모든 일기를 조회합니다.',
  })
  @ApiOkResponse({
    description: '사용자의 모든 일기를 성공적으로 조회했습니다.',
    schema: {
      type: 'array',
      items: {
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
    },
  })
  @ApiUnauthorizedResponse({ description: '사용자가 인증되지 않았습니다.' })
  async getUserDiaries(@Request() req) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userId = req.user.id;
    return this.diaryUseCase.getDiariesByUserId(userId);
  }
}
