import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { DiaryRepositoryAdapter } from './diary-repository.adapter';
import { Diary } from '../../../domain/diary';

describe('DiaryRepositoryAdapter', () => {
  let adapter: DiaryRepositoryAdapter;
  let mockPrismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    mockPrismaService = {
      diary: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(() => Promise.resolve({ id: 'aaaa1' })),
      },
      $transaction: jest.fn(async (cb) => {
        return await cb(mockPrismaService);
      }),
    } as unknown as jest.Mocked<PrismaService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiaryRepositoryAdapter,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    adapter = module.get<DiaryRepositoryAdapter>(DiaryRepositoryAdapter);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('createDiary', () => {
    it('should create a diary', async () => {
      const diaryData = new Diary(
        '000',
        'Test content',
        'http://test-image-url.com',
        'aaaa1',
        new Date(),
        new Date(),
      );
      const createdDiary = { ...diaryData, id: '1' };

      (mockPrismaService.diary.create as jest.Mock).mockResolvedValue(
        createdDiary,
      );

      const result = await adapter.createDiary(diaryData);

      expect(mockPrismaService.diary.create).toHaveBeenCalledWith({
        data: {
          content: diaryData.content,
          imageUrl: diaryData.imageUrl,
          userId: diaryData.userId,
        },
      });
      expect(result).toBeInstanceOf(Diary);
      expect(result).toEqual(expect.objectContaining(createdDiary));
    });
  });
});
