import {
  Controller,
  Post,
  Body,
  Request,
  UploadedFile,
  UseInterceptors,
  Inject,
  UseGuards,
  ParseFilePipe,
  MaxFileSizeValidator,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  FOOD_USE_CASE,
  FoodUseCase,
} from '@food/application/port/in/food.use-case';
import { FoodAnalysisDto } from './dto/food-analysis.dto';
import { ApiTags, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { SwaggerFood, SwaggerAnalyzeFoodImage } from './swagger.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';

@ApiTags('food')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiHeader({
  name: 'Authorization',
  description: 'JWT 토큰. 예: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
})
@Controller('food')
export class FoodController {
  constructor(
    @Inject(FOOD_USE_CASE)
    private readonly foodUseCase: FoodUseCase,
  ) {}

  @Post('analyze')
  @UseInterceptors(FileInterceptor('image'))
  @SwaggerFood('음식 이미지 분석')
  @SwaggerAnalyzeFoodImage()
  async analyzeFoodImage(
    @Body() foodAnalysisDto: FoodAnalysisDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 3 * 1024 * 1024,
            message: '파일 크기는 3MB를 초과할 수 없습니다.',
          }),
        ],
        exceptionFactory: (error) => {
          throw new BadRequestException(error);
        },
      }),
    )
    file: Express.Multer.File,
    @Request() req,
  ) {
    return this.foodUseCase.analyzeFoodImage(
      file,
      foodAnalysisDto.description,
      req.user.id,
    );
  }
}
