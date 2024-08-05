import { FoodBreakdown } from '@common/dto/Ingredient.dto';

export class Diary {
  constructor(
    public id: string,
    public content: string,
    public imageUrl: string,
    public userId: string,
    public createdAt: Date,
    public updatedAt: Date,
    public totalCalories?: number,
    public calorieBreakdown?: FoodBreakdown,
  ) {}
}
