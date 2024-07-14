import { Test, TestingModule } from '@nestjs/testing';
import { DiaryService } from './diary.service';
import {
  DIARY_REPOSITORY_PORT,
  DiaryRepositoryPort,
} from '../port/out/diary-repository.port';
import { S3Service } from '../../../common/s3/s3.service';
import { Diary } from '../../domain/diary';

describe('DiaryService', () => {
  let service: DiaryService;
  let mockDiaryRepository: jest.Mocked<DiaryRepositoryPort>;
  let mockS3Service: jest.Mocked<S3Service>;

  beforeEach(async () => {
    mockDiaryRepository = {
      createDiary: jest.fn(),
      findDiaryById: jest.fn(),
      findDiariesByUserId: jest.fn(),
    };

    mockS3Service = {
      uploadFile: jest.fn(),
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

      // expect(mockS3Service.uploadFile).toHaveBeenCalledWith(imageFile);
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

  // Add more tests for getDiaryById and getDiariesByUserId methods
});
