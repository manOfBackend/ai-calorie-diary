import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  DIARY_REPOSITORY_PORT,
  DiaryRepositoryPort,
} from '@diary/application/port/out/diary-repository.port';
import { FoodAnalyzedEvent } from '@food/domain/events/food-analyzed.event';

@Injectable()
export class FoodAnalyzedHandler {
  constructor(
    @Inject(DIARY_REPOSITORY_PORT)
    private diaryRepository: DiaryRepositoryPort,
  ) {}

  @OnEvent('food.analyzed')
  async handle(event: FoodAnalyzedEvent): Promise<void> {
    const { userId, imageUrl, description, analysis } = event.payload;
    await this.diaryRepository.createDiary({
      id: '0',
      createdAt: new Date(),
      updatedAt: new Date(),
      content: description,
      imageUrl,
      userId,
      totalCalories: analysis.totalCalories,
      calorieBreakdown: analysis.breakdown,
    });
  }
}
