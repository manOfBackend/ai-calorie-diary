import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { DiaryRepositoryPort } from '../../../application/port/out/diary-repository.port';
import { Diary } from '../../../domain/diary';

@Injectable()
export class DiaryRepositoryAdapter implements DiaryRepositoryPort {
  constructor(private prisma: PrismaService) {}

  async createDiary(diary: Diary): Promise<Diary> {
    return this.prisma.$transaction(async (prisma) => {
      const user = await prisma.user.findUnique({
        where: { id: diary.userId },
      });

      if (!user) {
        throw new NotFoundException(`User with id ${diary.userId} not found`);
      }

      const createdDiary = await prisma.diary.create({
        data: {
          content: diary.content,
          imageUrl: diary.imageUrl,
          userId: diary.userId,
        },
      });

      return this.mapToDomain(createdDiary);
    });
  }

  async findDiaryById(id: string): Promise<Diary | null> {
    const diary = await this.prisma.diary.findUnique({ where: { id } });
    return diary ? this.mapToDomain(diary) : null;
  }

  async findDiariesByUserId(userId: string): Promise<Diary[]> {
    const diaries = await this.prisma.diary.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return diaries.map(this.mapToDomain);
  }

  private mapToDomain(diary: any): Diary {
    return new Diary(
      diary.id,
      diary.content,
      diary.imageUrl,
      diary.userId,
      diary.createdAt,
      diary.updatedAt,
    );
  }
}
