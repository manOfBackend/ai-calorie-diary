// diary.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { DiaryUseCase } from '../port/in/diary.use-case';
import {
  DIARY_REPOSITORY_PORT,
  DiaryRepositoryPort,
} from '../port/out/diary-repository.port';
import { S3Service } from '../../../common/s3/s3.service';
import { Diary } from '../../domain/diary';

@Injectable()
export class DiaryService implements DiaryUseCase {
  constructor(
    @Inject(DIARY_REPOSITORY_PORT)
    private readonly diaryRepository: DiaryRepositoryPort,
    private readonly s3Service: S3Service,
  ) {}

  async createDiary(
    content: string,
    imageFile: Express.Multer.File | undefined,
    userId: string,
  ): Promise<Diary> {
    const imageUrl: string | null = null;
    if (imageFile) {
      // imageUrl = await this.s3Service.uploadFile(imageFile);
    }
    const diary = new Diary(
      '0',
      content,
      imageUrl,
      userId,
      new Date(),
      new Date(),
    );
    return this.diaryRepository.createDiary(diary);
  }

  async getDiaryById(id: string): Promise<Diary | null> {
    return this.diaryRepository.findDiaryById(id);
  }

  async getDiariesByUserId(userId: string): Promise<Diary[]> {
    return this.diaryRepository.findDiariesByUserId(userId);
  }
}
