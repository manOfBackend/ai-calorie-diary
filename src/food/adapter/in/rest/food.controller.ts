import {
  Controller,
  Post,
  Body,
  Request,
  UploadedFile,
  UseInterceptors,
  Inject,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  FOOD_USE_CASE,
  FoodUseCase,
} from '@food/application/port/in/food.use-case';
import { FoodAnalysisDto } from './dto/food-analysis.dto';

@Controller('food')
export class FoodController {
  constructor(
    @Inject(FOOD_USE_CASE)
    private readonly foodUseCase: FoodUseCase,
  ) {}

  @Post('analyze')
  @UseInterceptors(FileInterceptor('image'))
  async analyzeFoodImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() foodAnalysisDto: FoodAnalysisDto,
    @Request() req,
  ) {
    return this.foodUseCase.analyzeFoodImage(
      file,
      foodAnalysisDto.description,
      req.user.id,
    );
  }
}
