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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { DiaryUseCase } from '../../../application/port/in/diary.use-case';
import { CreateDiaryDto } from './dto/create-diary.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('diary')
@Controller('diary')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DiaryController {
  constructor(
    @Inject('DiaryUseCase')
    private readonly diaryUseCase: DiaryUseCase,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: '일기 작성' })
  @ApiResponse({
    status: 201,
    description: '일기가 성공적으로 작성되었습니다.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async createDiary(
    @Body() createDiaryDto: CreateDiaryDto,
    @UploadedFile() image: Express.Multer.File,
    @Request() req,
  ) {
    console.log('req.user:', req.user);
    console.log('req.headers:', req.headers);
    console.log('req.method:', req.method);
    console.log('req.url:', req.url);
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userId = req.user.id;
    return this.diaryUseCase.createDiary(createDiaryDto.content, image, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '특정 일기 조회' })
  @ApiResponse({ status: 200, description: '일기를 성공적으로 조회했습니다.' })
  async getDiary(@Param('id') id: string) {
    return this.diaryUseCase.getDiaryById(id);
  }

  @Get()
  @ApiOperation({ summary: '사용자의 모든 일기 조회' })
  @ApiResponse({
    status: 200,
    description: '사용자의 모든 일기를 성공적으로 조회했습니다.',
  })
  async getUserDiaries(@Request() req) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userId = req.user.id;
    return this.diaryUseCase.getDiariesByUserId(userId);
  }
}
