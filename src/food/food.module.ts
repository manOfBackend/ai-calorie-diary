import { Module } from '@nestjs/common';
import { FoodController } from './adapter/in/rest/food.controller';
import { FoodService } from './application/service/food.service';
import { OpenAIApiAdapter } from './adapter/out/api/openai-api.adapter';
import { S3Service } from '@common/s3/s3.service';
import { FOOD_USE_CASE } from './application/port/in/food.use-case';
import { OpenAIApiPortSymbol } from '@food/application/port/out/openai-api.port';

@Module({
  controllers: [FoodController],
  providers: [
    {
      provide: FOOD_USE_CASE,
      useClass: FoodService,
    },
    {
      provide: OpenAIApiPortSymbol,
      useClass: OpenAIApiAdapter,
    },
    S3Service,
  ],
})
export class FoodModule {}
