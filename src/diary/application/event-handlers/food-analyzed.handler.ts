import { Inject, Injectable } from '@nestjs/common';
import {
  EventSubscriber,
  EventSubscriberSymbol,
} from '@common/events/event-subscriber.interface';
import {
  DIARY_REPOSITORY_PORT,
  DiaryRepositoryPort,
} from '@diary/application/port/out/diary-repository.port';
import { FoodAnalyzedEvent } from '@food/domain/events/food-analyzed.event';

@Injectable()
export class FoodAnalyzedHandler {
  constructor(
    @Inject(EventSubscriberSymbol)
    private eventSubscriber: EventSubscriber,
    @Inject(DIARY_REPOSITORY_PORT)
    private diaryRepository: DiaryRepositoryPort,
  ) {
    this.eventSubscriber.subscribe(
      FoodAnalyzedEvent.name,
      this.handle.bind(this),
    );
  }

  async handle(event: FoodAnalyzedEvent): Promise<void> {
    const { userId, imageUrl, description, analysis } = event.payload;
    await this.diaryRepository.createDiary({
      id: '0',
      createdAt: new Date(),
      updatedAt: new Date(),
      content: description,
      imageUrl,
      userId,
      ingredients: analysis.ingredients,
      totalCalories: analysis.totalCalories,
      calorieBreakdown: analysis.breakdown,
    });
  }
}
