import { Test, TestingModule } from '@nestjs/testing';
import { DiaryService } from './diary.service';
import {
  DIARY_REPOSITORY_PORT,
  DiaryRepositoryPort,
} from '../port/out/diary-repository.port';
import { S3Service } from '@common/s3/s3.service';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Diary } from '@diary/domain/diary';
import { FoodBreakdown } from '@common/dto/Ingredient.dto';

describe('DiaryService', () => {
  let service: DiaryService;
  let mockDiaryRepository: jest.Mocked<DiaryRepositoryPort>;
  let mockS3Service: jest.Mocked<S3Service>;

  beforeEach(async () => {
    mockDiaryRepository = {
      createDiary: jest.fn(),
      findDiaryById: jest.fn(),
      findDiariesByUserId: jest.fn(),
      findDiariesByPeriod: jest.fn(),
      updateDiary: jest.fn(),
      deleteDiary: jest.fn(),
    };

    mockS3Service = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
    } as unknown as jest.Mocked<S3Service>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiaryService,
        {
          provide: DIARY_REPOSITORY_PORT,
          useValue: mockDiaryRepository,
        },
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
      ],
    }).compile();

    service = module.get<DiaryService>(DiaryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createDiary', () => {
    it('should create a diary with image and nutrition info', async () => {
      const content = 'Test content';
      const imageFile = { buffer: Buffer.from('test') } as Express.Multer.File;
      const userId = '1';
      const imageUrl = 'http://test-image-url.com';
      const totalCalories = 500;
      const calorieBreakdown: FoodBreakdown = {
        chicken: {
          protein: { amount: 30, unit: 'g', calories: 120 },
          fat: { amount: 10, unit: 'g', calories: 90 },
          carbohydrate: { amount: 0, unit: 'g', calories: 0 },
        },
        salad: {
          protein: { amount: 2, unit: 'g', calories: 8 },
          fat: { amount: 5, unit: 'g', calories: 45 },
          carbohydrate: { amount: 10, unit: 'g', calories: 40 },
        },
      };
      const createdDiary = new Diary(
        '1',
        content,
        imageUrl,
        userId,
        new Date(),
        new Date(),
        totalCalories,
        calorieBreakdown,
      );

      mockS3Service.uploadFile.mockResolvedValue(imageUrl);
      mockDiaryRepository.createDiary.mockResolvedValue(createdDiary);

      const result = await service.createDiary(
        content,
        imageFile,
        userId,
        totalCalories,
        calorieBreakdown,
      );

      expect(mockS3Service.uploadFile).toHaveBeenCalledWith(imageFile);
      expect(mockDiaryRepository.createDiary).toHaveBeenCalledWith(
        expect.any(Diary),
      );
      expect(result).toEqual(createdDiary);
    });

    it('should create a diary without image', async () => {
      const content = 'Test content';
      const userId = '1';
      const totalCalories = 200;
      const calorieBreakdown: FoodBreakdown = {
        apple: {
          protein: { amount: 0.3, unit: 'g', calories: 1 },
          fat: { amount: 0.2, unit: 'g', calories: 2 },
          carbohydrate: { amount: 25, unit: 'g', calories: 100 },
        },
        banana: {
          protein: { amount: 1.1, unit: 'g', calories: 4 },
          fat: { amount: 0.3, unit: 'g', calories: 3 },
          carbohydrate: { amount: 23, unit: 'g', calories: 92 },
        },
      };
      const createdDiary = new Diary(
        '1',
        content,
        null,
        userId,
        new Date(),
        new Date(),
        totalCalories,
        calorieBreakdown,
      );

      mockDiaryRepository.createDiary.mockResolvedValue(createdDiary);

      const result = await service.createDiary(
        content,
        undefined,
        userId,
        totalCalories,
        calorieBreakdown,
      );

      expect(mockS3Service.uploadFile).not.toHaveBeenCalled();
      expect(mockDiaryRepository.createDiary).toHaveBeenCalledWith(
        expect.any(Diary),
      );
      expect(result).toEqual(createdDiary);
    });
  });

  describe('getDiaryById', () => {
    it('should return a diary by id', async () => {
      const id = '1';
      const diary = new Diary(
        id,
        'Content',
        null,
        'userId',
        new Date(),
        new Date(),
        100,
        {},
      );

      mockDiaryRepository.findDiaryById.mockResolvedValue(diary);

      const result = await service.getDiaryById(id, 'userId');

      expect(result).toEqual(diary);
    });

    it('should throw NotFoundException when diary does not exist', async () => {
      const id = '1';

      mockDiaryRepository.findDiaryById.mockResolvedValue(null);

      await expect(service.getDiaryById(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDiariesByUserId', () => {
    it('should return diaries for a user', async () => {
      const userId = '1';
      const diaries = [
        new Diary(
          '1',
          'Content 1',
          null,
          userId,
          new Date(),
          new Date(),
          100,
          {},
        ),
        new Diary(
          '2',
          'Content 2',
          null,
          userId,
          new Date(),
          new Date(),
          200,
          {},
        ),
      ];

      mockDiaryRepository.findDiariesByUserId.mockResolvedValue(diaries);

      const result = await service.getDiariesByUserId(userId);

      expect(result).toEqual(diaries);
    });

    it('should throw NotFoundException when no diaries found', async () => {
      const userId = '1';

      mockDiaryRepository.findDiariesByUserId.mockResolvedValue(null);

      await expect(service.getDiariesByUserId(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getDiariesByPeriod', () => {
    it('should return diaries for a specific period', async () => {
      const userId = '1';
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      const mockDiaries = [
        new Diary(
          '1',
          'Diary 1',
          null,
          userId,
          new Date('2023-06-15'),
          new Date('2023-06-15'),
          500,
          {},
        ),
        new Diary(
          '2',
          'Diary 2',
          null,
          userId,
          new Date('2023-09-01'),
          new Date('2023-09-01'),
          700,
          {},
        ),
      ];

      mockDiaryRepository.findDiariesByPeriod.mockResolvedValue(mockDiaries);

      const result = await service.getDiariesByPeriod(
        userId,
        startDate,
        endDate,
      );

      expect(mockDiaryRepository.findDiariesByPeriod).toHaveBeenCalledWith(
        userId,
        startDate,
        endDate,
      );
      expect(result).toEqual(mockDiaries);
    });

    it('should return empty array when no diaries found in the period', async () => {
      const userId = '1';
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');

      mockDiaryRepository.findDiariesByPeriod.mockResolvedValue([]);

      await expect(
        service.getDiariesByPeriod(userId, startDate, endDate),
      ).resolves.toEqual([]);
    });
  });

  describe('updateDiary', () => {
    it('should update a diary with new image and nutrition info', async () => {
      const id = '1';
      const content = 'Updated content';
      const imageFile = {
        buffer: Buffer.from('new image'),
      } as Express.Multer.File;
      const userId = '1';
      const newImageUrl = 'http://new-image-url.com';
      const totalCalories = 400;
      const calorieBreakdown: FoodBreakdown = {
        chicken: {
          protein: { amount: 25, unit: 'g', calories: 100 },
          fat: { amount: 8, unit: 'g', calories: 72 },
          carbohydrate: { amount: 0, unit: 'g', calories: 0 },
        },
        broccoli: {
          protein: { amount: 3, unit: 'g', calories: 12 },
          fat: { amount: 0.5, unit: 'g', calories: 4.5 },
          carbohydrate: { amount: 7, unit: 'g', calories: 28 },
        },
      };
      const updatedDiary = new Diary(
        id,
        content,
        newImageUrl,
        userId,
        new Date(),
        new Date(),
        totalCalories,
        calorieBreakdown,
      );

      mockDiaryRepository.findDiaryById.mockResolvedValue(
        new Diary(
          id,
          'Old content',
          'http://old-image-url.com',
          userId,
          new Date(),
          new Date(),
          300,
          {},
        ),
      );
      mockS3Service.uploadFile.mockResolvedValue(newImageUrl);
      mockDiaryRepository.updateDiary.mockResolvedValue(updatedDiary);

      const result = await service.updateDiary(
        id,
        content,
        imageFile,
        userId,
        totalCalories,
        calorieBreakdown,
      );

      expect(mockS3Service.uploadFile).toHaveBeenCalledWith(imageFile);
      expect(mockDiaryRepository.updateDiary).toHaveBeenCalledWith(
        id,
        expect.objectContaining({
          content,
          imageUrl: newImageUrl,
          totalCalories,
          calorieBreakdown,
        }),
      );
      expect(result).toEqual(updatedDiary);
    });

    it('should update a diary without changing the image but updating nutrition info', async () => {
      const id = '1';
      const content = 'Updated content';
      const userId = '1';
      const oldImageUrl = 'http://old-image-url.com';
      const totalCalories = 200;
      const calorieBreakdown: FoodBreakdown = {
        apple: {
          protein: { amount: 0.3, unit: 'g', calories: 1 },
          fat: { amount: 0.2, unit: 'g', calories: 2 },
          carbohydrate: { amount: 25, unit: 'g', calories: 100 },
        },
        banana: {
          protein: { amount: 1.1, unit: 'g', calories: 4 },
          fat: { amount: 0.3, unit: 'g', calories: 3 },
          carbohydrate: { amount: 23, unit: 'g', calories: 92 },
        },
      };
      const updatedDiary = new Diary(
        id,
        content,
        oldImageUrl,
        userId,
        new Date(),
        new Date(),
        totalCalories,
        calorieBreakdown,
      );

      mockDiaryRepository.findDiaryById.mockResolvedValue(
        new Diary(
          id,
          'Old content',
          oldImageUrl,
          userId,
          new Date(),
          new Date(),
          300,
          {},
        ),
      );
      mockDiaryRepository.updateDiary.mockResolvedValue(updatedDiary);

      const result = await service.updateDiary(
        id,
        content,
        undefined,
        userId,
        totalCalories,
        calorieBreakdown,
      );

      expect(mockS3Service.uploadFile).not.toHaveBeenCalled();
      expect(mockDiaryRepository.updateDiary).toHaveBeenCalledWith(
        id,
        expect.objectContaining({
          content,
          imageUrl: oldImageUrl,
          totalCalories,
          calorieBreakdown,
        }),
      );
      expect(result).toEqual(updatedDiary);
    });

    it('should throw UnauthorizedException when user is not the owner', async () => {
      const id = '1';
      const content = 'Updated content';
      const userId = '2';

      mockDiaryRepository.findDiaryById.mockResolvedValue(
        new Diary(id, 'Old content', null, '1', new Date(), new Date(), 0, {}),
      );

      await expect(
        service.updateDiary(id, content, undefined, userId),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException when diary does not exist', async () => {
      const id = '1';
      const content = 'Updated content';
      const userId = '1';

      mockDiaryRepository.findDiaryById.mockResolvedValue(null);

      await expect(
        service.updateDiary(id, content, undefined, userId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteDiary', () => {
    it('should delete a diary', async () => {
      const id = '1';
      const userId = '1';
      const diaryToDelete = new Diary(
        id,
        'Content',
        'http://image-url.com',
        userId,
        new Date(),
        new Date(),
        100,
        {},
      );

      mockDiaryRepository.findDiaryById.mockResolvedValue(diaryToDelete);
      mockDiaryRepository.deleteDiary.mockResolvedValue();
      mockS3Service.deleteFile.mockResolvedValue();

      await service.deleteDiary(id, userId);

      expect(mockDiaryRepository.deleteDiary).toHaveBeenCalledWith(id);
      expect(mockS3Service.deleteFile).toHaveBeenCalledWith(
        'http://image-url.com',
      );
    });

    it('should throw UnauthorizedException when user is not the owner', async () => {
      const id = '1';
      const userId = '2';

      mockDiaryRepository.findDiaryById.mockResolvedValue(
        new Diary(id, 'Content', null, '1', new Date(), new Date(), 0, {}),
      );

      await expect(service.deleteDiary(id, userId)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw NotFoundException when diary does not exist', async () => {
      const id = '1';
      const userId = '1';

      mockDiaryRepository.findDiaryById.mockResolvedValue(null);

      await expect(service.deleteDiary(id, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
