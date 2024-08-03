import { Diary } from '../../../domain/diary';

export const DIARY_USE_CASE = Symbol('DIARY_USE_CASE');

export interface DiaryUseCase {
  createDiary(
    content: string,
    image: Express.Multer.File | undefined,
    userId: string,
  ): Promise<Diary>;
  getDiaryById(id: string, userId: string): Promise<Diary>;
  getDiariesByUserId(userId: string): Promise<Diary[]>;
  updateDiary(
    id: string,
    content: string,
    image: Express.Multer.File | undefined,
    userId: string,
  ): Promise<Diary>;
  deleteDiary(id: string, userId: string): Promise<void>;
}
