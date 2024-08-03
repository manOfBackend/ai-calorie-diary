import { Event } from '@common/events/event.interface';
import { FoodAnalysis } from '../food-analysis';

export class FoodAnalyzedEvent implements Event {
  name = 'food.analyzed';

  constructor(
    public payload: {
      userId: string;
      imageUrl: string;
      description: string;
      analysis: FoodAnalysis;
    },
  ) {}
}
