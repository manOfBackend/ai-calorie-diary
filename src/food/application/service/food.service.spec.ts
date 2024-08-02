import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FoodService } from './food.service';
import {
  OpenAIApiPort,
  OpenAIApiPortSymbol,
} from '../port/out/openai-api.port';
import { S3Service } from '@common/s3/s3.service';
import { FoodAnalysis } from '@food/domain/food-analysis';
import { FoodAnalyzedEvent } from '@food/domain/events/food-analyzed.event';

// sharp 모듈을 모킹합니다.
jest.mock('sharp', () => {
  return jest.fn().mockImplementation(() => ({
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('compressed image')),
  }));
});

describe('FoodService', () => {
  let service: FoodService;
  let openAIApiPort: jest.Mocked<OpenAIApiPort>;
  let s3Service: jest.Mocked<S3Service>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FoodService,
        {
          provide: OpenAIApiPortSymbol,
          useValue: {
            analyzeFood: jest.fn(),
          },
        },
        {
          provide: S3Service,
          useValue: {
            uploadFile: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FoodService>(FoodService);
    openAIApiPort = module.get(OpenAIApiPortSymbol);
    s3Service = module.get(S3Service);
    eventEmitter = module.get(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeFoodImage', () => {
    it('should analyze food image, upload to S3, and emit event', async () => {
      // Arrange
      const mockFile: Express.Multer.File = {
        buffer: Buffer.from('test image'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        fieldname: 'image',
      } as Express.Multer.File;

      const mockDescription = 'Test food description';
      const mockUserId = 'user123';
      const mockImageUrl = 'https://example.com/image.jpg';
      const mockFoodAnalysis: FoodAnalysis = {
        ingredients: ['ingredient1', 'ingredient2'],
        totalCalories: 500,
        breakdown: { ingredient1: 250, ingredient2: 250 },
      };

      s3Service.uploadFile.mockResolvedValue(mockImageUrl);
      openAIApiPort.analyzeFood.mockResolvedValue(mockFoodAnalysis);

      // Act
      const result = await service.analyzeFoodImage(
        mockFile,
        mockDescription,
        mockUserId,
      );

      // Assert
      expect(s3Service.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          buffer: expect.any(Buffer),
          size: expect.any(Number),
        }),
      );
      expect(openAIApiPort.analyzeFood).toHaveBeenCalledWith(
        expect.objectContaining({
          buffer: expect.any(Buffer),
          size: expect.any(Number),
        }),
        mockDescription,
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'food.analyzed',
        expect.any(FoodAnalyzedEvent),
      );
      expect(result).toEqual(mockFoodAnalysis);
    });

    it('should throw an error if image compression fails', async () => {
      // Arrange
      const mockFile: Express.Multer.File = {
        buffer: Buffer.from('test image'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        fieldname: 'image',
      } as Express.Multer.File;

      const sharp = jest.requireMock('sharp');
      sharp.mockImplementationOnce(() => {
        throw new Error('Compression failed');
      });

      // Act & Assert
      await expect(
        service.analyzeFoodImage(mockFile, 'description', 'user123'),
      ).rejects.toThrow('Compression failed');
    });
  });
});
