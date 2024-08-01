import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { S3Service } from '@common/s3/s3.service';
import { Diary } from '@diary/domain/diary';
import { DiaryUseCase } from '@diary/application/port/in/diary.use-case';
import {
  DIARY_REPOSITORY_PORT,
  DiaryRepositoryPort,
} from '@diary/application/port/out/diary-repository.port';

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
    let imageUrl: string | null = null;
    if (imageFile) {
      imageUrl = await this.s3Service.uploadFile(imageFile);
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
    const existingDiary = await this.diaryRepository.findDiaryById(id);
    if (!existingDiary) {
      throw new NotFoundException('Diary not found');
    }
    return existingDiary;
  }

  async getDiariesByUserId(userId: string): Promise<Diary[]> {
    const existingDiary = await this.diaryRepository.findDiariesByUserId(
      userId,
    );
    if (!existingDiary) {
      throw new NotFoundException('Diary not found');
    }
    return existingDiary;
  }

  async updateDiary(
    id: string,
    content: string,
    imageFile: Express.Multer.File | undefined,
    userId: string,
  ): Promise<Diary> {
    const existingDiary = await this.diaryRepository.findDiaryById(id);
    if (!existingDiary) {
      throw new NotFoundException('Diary not found');
    }
    if (existingDiary.userId !== userId) {
      throw new UnauthorizedException(
        'You are not authorized to update this diary',
      );
    }

    let imageUrl = existingDiary.imageUrl;
    if (imageFile) {
      imageUrl = await this.s3Service.uploadFile(imageFile);
    }

    return this.diaryRepository.updateDiary(id, { content, imageUrl });
  }

  async deleteDiary(id: string, userId: string): Promise<void> {
    const existingDiary = await this.diaryRepository.findDiaryById(id);
    if (!existingDiary) {
      throw new NotFoundException('Diary not found');
    }
    if (existingDiary.userId !== userId) {
      throw new UnauthorizedException(
        'You are not authorized to delete this diary',
      );
    }

    await this.s3Service.deleteFile(existingDiary.imageUrl);
    await this.diaryRepository.deleteDiary(id);
  }
}
