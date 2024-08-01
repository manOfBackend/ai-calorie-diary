import { Diary } from '@diary/domain/diary';

export const DIARY_USE_CASE = 'DIARY_USE_CASE';

export interface DiaryUseCase {
  createDiary(
    content: string,
    imageFile: Express.Multer.File | undefined,
    userId: string,
  ): Promise<Diary>;
  getDiaryById(id: string): Promise<Diary | null>;
  getDiariesByUserId(userId: string): Promise<Diary[]>;
  updateDiary(
    id: string,
    content: string,
    imageFile: Express.Multer.File | undefined,
    userId: string,
  ): Promise<Diary>;
  deleteDiary(id: string, userId: string): Promise<void>;
}
