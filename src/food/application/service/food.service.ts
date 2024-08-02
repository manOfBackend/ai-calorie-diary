import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FoodUseCase } from '@food/application/port/in/food.use-case';
import {
  OpenAIApiPortSymbol,
  OpenAIApiPort,
} from '../port/out/openai-api.port';
import { FoodAnalysis } from '@food/domain/food-analysis';
import { S3Service } from '@common/s3/s3.service';
import { FoodAnalyzedEvent } from '@food/domain/events/food-analyzed.event';

@Injectable()
export class FoodService implements FoodUseCase {
  constructor(
    @Inject(OpenAIApiPortSymbol)
    private readonly openAIApiPort: OpenAIApiPort,
    private readonly s3Service: S3Service,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async analyzeFoodImage(
    image: Express.Multer.File,
    description: string,
    userId: string,
  ): Promise<FoodAnalysis> {
    const imageUrl = await this.s3Service.uploadFile(image);
    const foodAnalysis = await this.openAIApiPort.analyzeFood(
      image,
      description,
    );

    this.eventEmitter.emit(
      'food.analyzed',
      new FoodAnalyzedEvent({
        userId,
        imageUrl,
        description,
        analysis: foodAnalysis,
      }),
    );

    return foodAnalysis;
  }
}
