import { Diary } from '../../../domain/diary';

export const DIARY_REPOSITORY_PORT = 'DIARY_REPOSITORY_PORT';

export interface DiaryRepositoryPort {
  createDiary(diary: Diary): Promise<Diary>;
  findDiaryById(id: string): Promise<Diary | null>;
  findDiariesByUserId(userId: string): Promise<Diary[]>;
  updateDiary(id: string, diary: Partial<Diary>): Promise<Diary>;
  deleteDiary(id: string): Promise<void>;
}
