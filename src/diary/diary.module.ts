import { Module } from '@nestjs/common';
import { DiaryController } from './adapter/in/rest/diary.controller';
import { DiaryService } from './application/service/diary.service';
import { DiaryRepositoryAdapter } from './adapter/out/persistence/diary-repository.adapter';
import { DIARY_REPOSITORY_PORT } from './application/port/out/diary-repository.port';
import { S3Service } from '../common/s3/s3.service';
import { PrismaService } from '../common/prisma/prisma.service';

@Module({
  controllers: [DiaryController],
  providers: [
    {
      provide: 'DiaryUseCase',
      useClass: DiaryService,
    },
    {
      provide: DIARY_REPOSITORY_PORT,
      useClass: DiaryRepositoryAdapter,
    },
    S3Service,
    PrismaService,
  ],
  exports: ['DiaryUseCase'],
})
export class DiaryModule {}
