import { FoodAnalysis } from '@food/domain/food-analysis';

export interface OpenAIApiPort {
  analyzeFood(
    image: Express.Multer.File,
    description: string,
  ): Promise<FoodAnalysis>;
}

export const OpenAIApiPortSymbol = Symbol('OpenAIApiPort');
