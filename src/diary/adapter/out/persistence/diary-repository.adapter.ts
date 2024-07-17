import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { DiaryRepositoryPort } from '../../../application/port/out/diary-repository.port';
import { Diary } from '../../../domain/diary';

@Injectable()
export class DiaryRepositoryAdapter implements DiaryRepositoryPort {
  constructor(private prisma: PrismaService) {}

  async createDiary(diary: Diary): Promise<Diary> {
    return this.prisma.$transaction(async (prisma) => {
      // 사용자 존재 여부 확인
      const allUsers = await prisma.user.findMany();
      console.log(allUsers);
      const user = await prisma.user.findUnique({
        where: { id: diary.userId },
      });

      if (!user) {
        throw new NotFoundException(`User with id ${diary.userId} not found`);
      }

      // 일기 생성
      const createdDiary = await prisma.diary.create({
        data: {
          content: diary.content,
          imageUrl: diary.imageUrl,
          userId: diary.userId,
        },
      });

      return new Diary(
        createdDiary.id,
        createdDiary.content,
        createdDiary.imageUrl,
        createdDiary.userId,
        createdDiary.createdAt,
        createdDiary.updatedAt,
      );
    });
  }

  async findDiaryById(id: string): Promise<Diary | null> {
    const diary = await this.prisma.diary.findUnique({ where: { id } });
    return diary
      ? new Diary(
          diary.id,
          diary.content,
          diary.imageUrl,
          diary.userId,
          diary.createdAt,
          diary.updatedAt,
        )
      : null;
  }

  async findDiariesByUserId(userId: string): Promise<Diary[]> {
    const diaries = await this.prisma.diary.findMany();
    return diaries.map(
      (diary) =>
        new Diary(
          diary.id,
          diary.content,
          diary.imageUrl,
          diary.userId,
          diary.createdAt,
          diary.updatedAt,
        ),
    );
  }
}
