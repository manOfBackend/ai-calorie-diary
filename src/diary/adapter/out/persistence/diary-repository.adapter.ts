import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { DiaryRepositoryPort } from '@diary/application/port/out/diary-repository.port';
import { Diary } from '@diary/domain/diary';

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
          totalCalories: diary.totalCalories,
          calorieBreakdown: diary.calorieBreakdown,
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

  async findDiariesByPeriod(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Diary[]> {
    const diaries = await this.prisma.diary.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return diaries.map(this.mapToDomain);
  }

  async updateDiary(id: string, diary: Partial<Diary>): Promise<Diary> {
    const updatedDiary = await this.prisma.diary.update({
      where: { id },
      data: {
        content: diary.content,
        imageUrl: diary.imageUrl,
        totalCalories: diary.totalCalories,
        calorieBreakdown: diary.calorieBreakdown,
        updatedAt: new Date(),
      },
    });

    return this.mapToDomain(updatedDiary);
  }

  async deleteDiary(id: string): Promise<void> {
    await this.prisma.diary.delete({ where: { id } });
  }

  private mapToDomain(diary: any): Diary {
    return new Diary(
      diary.id,
      diary.content,
      diary.imageUrl,
      diary.userId,
      diary.createdAt,
      diary.updatedAt,
      diary.totalCalories,
      diary.calorieBreakdown,
    );
  }
}
