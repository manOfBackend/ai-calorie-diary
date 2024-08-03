import { FoodBreakdown } from '@common/dto/Ingredient.dto';

export class FoodAnalysis {
  constructor(
    public ingredients: string[],
    public totalCalories: number,
    public breakdown: FoodBreakdown,
  ) {}
}
