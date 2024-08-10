import { Module } from '@nestjs/common';
import { DiaryController } from './adapter/in/rest/diary.controller';
import { DiaryService } from './application/service/diary.service';
import { DiaryRepositoryAdapter } from './adapter/out/persistence/diary-repository.adapter';
import { DIARY_REPOSITORY_PORT } from './application/port/out/diary-repository.port';
import { S3Service } from '@common/s3/s3.service';
import { PrismaService } from '@common/prisma/prisma.service';
import { DIARY_USE_CASE } from './application/port/in/diary.use-case';
import { MetricsModule } from '@common/metrics/metrics.module';

@Module({
  imports: [MetricsModule],
  controllers: [DiaryController],
  providers: [
    {
      provide: DIARY_USE_CASE,
      useClass: DiaryService,
    },
    {
      provide: DIARY_REPOSITORY_PORT,
      useClass: DiaryRepositoryAdapter,
    },
    S3Service,
    PrismaService,
  ],
  exports: [DIARY_USE_CASE],
})
export class DiaryModule {}
