import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Inject,
  Delete,
  Put,
  ParseUUIDPipe,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import {
  DIARY_USE_CASE,
  DiaryUseCase,
} from '@diary/application/port/in/diary.use-case';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { ApiTags, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import {
  SwaggerDiary,
  SwaggerCreateDiary,
  SwaggerGetDiary,
  SwaggerUpdateDiary,
  SwaggerDeleteDiary,
  SwaggerGetUserDiaries,
} from './swagger.decorator';
import { User } from '@common/decorators/user.decorator';

@ApiTags('diary')
@Controller('diary')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({
  name: 'Authorization',
  description: 'JWT 토큰. 예: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
})
@UsePipes(new ValidationPipe({ transform: true }))
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
    @User('id') userId: string,
  ) {
    try {
      const calorieBreakdown =
        typeof createDiaryDto.calorieBreakdown === 'string'
          ? JSON.parse(createDiaryDto.calorieBreakdown)
          : createDiaryDto.calorieBreakdown;

      return this.diaryUseCase.createDiary(
        createDiaryDto.content,
        image,
        userId,
        createDiaryDto.totalCalories,
        calorieBreakdown,
      );
    } catch (error) {
      console.log(error);
    }
  }

  @Get(':id')
  @SwaggerDiary('특정 일기 조회')
  @SwaggerGetDiary()
  async getDiary(
    @Param('id', ParseUUIDPipe) id: string,
    @User('id') userId: string,
  ) {
    return this.diaryUseCase.getDiaryById(id, userId);
  }

  @Get()
  @SwaggerDiary('사용자의 모든 일기 조회')
  @SwaggerGetUserDiaries()
  async getUserDiaries(@User('id') userId: string) {
    return this.diaryUseCase.getDiariesByUserId(userId);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('image'))
  @SwaggerDiary('일기 수정')
  @SwaggerUpdateDiary()
  async updateDiary(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDiaryDto: CreateDiaryDto,
    @UploadedFile() image: Express.Multer.File,
    @User('id') userId: string,
  ) {
    return this.diaryUseCase.updateDiary(
      id,
      updateDiaryDto.content,
      image,
      userId,
      updateDiaryDto.totalCalories,
      updateDiaryDto.calorieBreakdown,
    );
  }

  @Delete(':id')
  @SwaggerDiary('일기 삭제')
  @SwaggerDeleteDiary()
  async deleteDiary(
    @Param('id', ParseUUIDPipe) id: string,
    @User('id') userId: string,
  ) {
    await this.diaryUseCase.deleteDiary(id, userId);
    return { message: 'Diary successfully deleted' };
  }
}
