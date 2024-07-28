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
  Delete,
  Put,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import {
  DIARY_USE_CASE,
  DiaryUseCase,
} from '../../../application/port/in/diary.use-case';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { ApiTags, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import {
  SwaggerDiary,
  SwaggerCreateDiary,
  SwaggerGetDiary,
  SwaggerUpdateDiary,
  SwaggerDeleteDiary,
} from './swagger.decorator';

@ApiTags('diary')
@Controller('diary')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({
  name: 'Authorization',
  description: 'JWT 토큰. 예: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
})
export class DiaryController {
  constructor(
    @Inject(DIARY_USE_CASE)
    private readonly diaryUseCase: DiaryUseCase,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @SwaggerDiary('일기 작성')
  @SwaggerCreateDiary()
  async createDiary(
    @Body() createDiaryDto: CreateDiaryDto,
    @UploadedFile() image: Express.Multer.File,
    @Request() req,
  ) {
    this.checkAuthentication(req);
    return this.diaryUseCase.createDiary(
      createDiaryDto.content,
      image,
      req.user.id,
    );
  }

  @Get(':id')
  @SwaggerDiary('특정 일기 조회')
  @SwaggerGetDiary()
  async getDiary(@Param('id') id: string, @Request() req) {
    this.checkAuthentication(req);
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
  @SwaggerDiary('사용자의 모든 일기 조회')
  async getUserDiaries(@Request() req) {
    this.checkAuthentication(req);
    return this.diaryUseCase.getDiariesByUserId(req.user.id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('image'))
  @SwaggerDiary('일기 수정')
  @SwaggerUpdateDiary()
  async updateDiary(
    @Param('id') id: string,
    @Body() updateDiaryDto: CreateDiaryDto,
    @UploadedFile() image: Express.Multer.File,
    @Request() req,
  ) {
    this.checkAuthentication(req);
    return this.diaryUseCase.updateDiary(
      id,
      updateDiaryDto.content,
      image,
      req.user.id,
    );
  }

  @Delete(':id')
  @SwaggerDiary('일기 삭제')
  @SwaggerDeleteDiary()
  async deleteDiary(@Param('id') id: string, @Request() req) {
    this.checkAuthentication(req);
    await this.diaryUseCase.deleteDiary(id, req.user.id);
    return { message: 'Diary successfully deleted' };
  }

  private checkAuthentication(req: any) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
  }
}
