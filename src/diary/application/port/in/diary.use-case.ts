import { Diary } from '@diary/domain/diary';
import { FoodBreakdown } from '@common/dto/Ingredient.dto';

export const DIARY_USE_CASE = Symbol('DIARY_USE_CASE');

export interface DiaryUseCase {
  createDiary(
    content: string,
    image: Express.Multer.File | undefined,
    userId: string,
    ingredients: string[],
    totalCalories: number | null,
    calorieBreakdown: FoodBreakdown | null,
  ): Promise<Diary>;

  getDiaryById(id: string, userId: string): Promise<Diary>;

  getDiariesByUserId(userId: string): Promise<Diary[]>;

  updateDiary(
    id: string,
    content: string,
    image: Express.Multer.File | undefined,
    userId: string,
    ingredients?: string[],
    totalCalories?: number | null,
    calorieBreakdown?: FoodBreakdown | null,
  ): Promise<Diary>;

  deleteDiary(id: string, userId: string): Promise<void>;
}
