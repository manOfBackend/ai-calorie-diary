import { FoodAnalysis } from '@food/domain/food-analysis';

export interface FoodUseCase {
  analyzeFoodImage(
    image: Express.Multer.File,
    description: string,
    userId: string,
  ): Promise<FoodAnalysis>;
}

export const FOOD_USE_CASE = Symbol('FOOD_USE_CASE');
