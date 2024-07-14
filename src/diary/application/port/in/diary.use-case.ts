// diary.use-case.ts
import { Diary } from '../../../domain/diary';

export interface DiaryUseCase {
  createDiary(
    content: string,
    imageFile: Express.Multer.File | undefined,
    userId: string,
  ): Promise<Diary>;
  getDiaryById(id: string): Promise<Diary | null>;
  getDiariesByUserId(userId: string): Promise<Diary[]>;
}
