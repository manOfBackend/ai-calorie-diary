import { Test, TestingModule } from '@nestjs/testing';
import { DiaryService } from './diary.service';
import {
  DIARY_REPOSITORY_PORT,
  DiaryRepositoryPort,
} from '../port/out/diary-repository.port';
import { S3Service } from '@common/s3/s3.service';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Diary } from '@diary/domain/diary';

describe('DiaryService', () => {
  let service: DiaryService;
  let mockDiaryRepository: jest.Mocked<DiaryRepositoryPort>;
  let mockS3Service: jest.Mocked<S3Service>;

  beforeEach(async () => {
    mockDiaryRepository = {
      createDiary: jest.fn(),
      findDiaryById: jest.fn(),
      findDiariesByUserId: jest.fn(),
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
    it('should create a diary with image', async () => {
      const content = 'Test content';
      const imageFile = { buffer: Buffer.from('test') } as Express.Multer.File;
      const userId = '1';
      const imageUrl = 'http://test-image-url.com';
      const createdDiary = new Diary(
        '1',
        content,
        imageUrl,
        userId,
        new Date(),
        new Date(),
      );

      mockS3Service.uploadFile.mockResolvedValue(imageUrl);
      mockDiaryRepository.createDiary.mockResolvedValue(createdDiary);

      const result = await service.createDiary(content, imageFile, userId);

      expect(mockS3Service.uploadFile).toHaveBeenCalledWith(imageFile);
      expect(mockDiaryRepository.createDiary).toHaveBeenCalledWith(
        expect.any(Diary),
      );
      expect(result).toEqual(createdDiary);
    });

    it('should create a diary without image', async () => {
      const content = 'Test content';
      const userId = '1';
      const createdDiary = new Diary(
        '1',
        content,
        null,
        userId,
        new Date(),
        new Date(),
      );

      mockDiaryRepository.createDiary.mockResolvedValue(createdDiary);

      const result = await service.createDiary(content, undefined, userId);

      expect(mockS3Service.uploadFile).not.toHaveBeenCalled();
      expect(mockDiaryRepository.createDiary).toHaveBeenCalledWith(
        expect.any(Diary),
      );
      expect(result).toEqual(createdDiary);
    });
  });

  describe('updateDiary', () => {
    it('should update a diary with new image', async () => {
      const id = '1';
      const content = 'Updated content';
      const imageFile = {
        buffer: Buffer.from('new image'),
      } as Express.Multer.File;
      const userId = '1';
      const newImageUrl = 'http://new-image-url.com';
      const updatedDiary = new Diary(
        id,
        content,
        newImageUrl,
        userId,
        new Date(),
        new Date(),
      );

      mockDiaryRepository.findDiaryById.mockResolvedValue(
        new Diary(
          id,
          'Old content',
          'http://old-image-url.com',
          userId,
          new Date(),
          new Date(),
        ),
      );
      mockS3Service.uploadFile.mockResolvedValue(newImageUrl);
      mockDiaryRepository.updateDiary.mockResolvedValue(updatedDiary);

      const result = await service.updateDiary(id, content, imageFile, userId);

      expect(mockS3Service.uploadFile).toHaveBeenCalledWith(imageFile);
      expect(mockDiaryRepository.updateDiary).toHaveBeenCalledWith(
        id,
        expect.objectContaining({ content, imageUrl: newImageUrl }),
      );
      expect(result).toEqual(updatedDiary);
    });

    it('should throw UnauthorizedException when user is not the owner', async () => {
      const id = '1';
      const content = 'Updated content';
      const userId = '2';

      mockDiaryRepository.findDiaryById.mockResolvedValue(
        new Diary(id, 'Old content', null, '1', new Date(), new Date()),
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
        new Diary(id, 'Content', null, '1', new Date(), new Date()),
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

  describe('getDiaryById', () => {
    it('should return a diary by id', async () => {
      const id = '1';
      const userId = '1';
      const diary = new Diary(
        id,
        'Content',
        null,
        userId,
        new Date(),
        new Date(),
      );

      mockDiaryRepository.findDiaryById.mockResolvedValue(diary);

      const result = await service.getDiaryById(id);

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
        new Diary('1', 'Content 1', null, userId, new Date(), new Date()),
        new Diary('2', 'Content 2', null, userId, new Date(), new Date()),
      ];

      mockDiaryRepository.findDiariesByUserId.mockResolvedValue(diaries);

      const result = await service.getDiariesByUserId(userId);

      expect(result).toEqual(diaries);
    });
  });
});
