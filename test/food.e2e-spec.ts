import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import {
  FoodUseCase,
  FOOD_USE_CASE,
} from '@food/application/port/in/food.use-case';
import { FoodAnalysis } from '@food/domain/food-analysis';
import * as path from 'path';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@common/prisma/prisma.service';

describe('FoodController (e2e)', () => {
  let app: INestApplication;
  let mockFoodUseCase: Partial<FoodUseCase>;
  let authToken: string;
  let jwtService: JwtService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    mockFoodUseCase = {
      analyzeFoodImage: jest.fn().mockResolvedValue(
        new FoodAnalysis(['chicken', 'salad'], 350, {
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
        }),
      ),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(FOOD_USE_CASE)
      .useValue(mockFoodUseCase)
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaService = app.get(PrismaService);
    jwtService = app.get(JwtService);
    // 데이터베이스 정리
    await prismaService.$transaction(async (prisma) => {
      await prisma.diary.deleteMany();
      await prisma.user.deleteMany();

      // 테스트용 사용자 생성
      const user = await prisma.user.create({
        data: {
          email: 'test_diary@example.com',
          password: 'hashedpassword',
        },
      });

      // JWT 토큰 생성
      authToken = jwtService.sign({ sub: user.id, email: user.email });
    });
  });

  it('/food/analyze (POST) - successful analysis', () => {
    const filePath = path.join(__dirname, 'assets', 'mac.png');

    return request(app.getHttpServer())
      .post('/food/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('image', filePath)
      .field('description', '치킨 샐러드')
      .expect(201)
      .expect((res) => {
        expect(res.body).toEqual({
          ingredients: ['chicken', 'salad'],
          totalCalories: 350,
          breakdown: {
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
          },
        });
      });
  });

  it('/food/analyze (POST) - file size exceeds limit', () => {
    const largeFakeFile = Buffer.alloc(4 * 1024 * 1024); // 4MB

    return request(app.getHttpServer())
      .post('/food/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('image', largeFakeFile, 'large_image.jpg')
      .field('description', '큰 이미지')
      .expect(400)
      .expect((res) => {
        expect(res.body.message).toContain(
          '파일 크기는 3MB를 초과할 수 없습니다.',
        );
      });
  });

  it('/food/analyze (POST) - invalid file type', () => {
    const filePath = path.join(__dirname, 'assets', 'test.txt');

    return request(app.getHttpServer())
      .post('/food/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('image', filePath)
      .field('description', '잘못된 파일 타입')
      .expect(400)
      .expect((res) => {
        expect(res.body.message).toContain(
          'Validation failed (expected type is /(jpg|jpeg|png)$/)',
        );
      });
  });

  afterAll(async () => {
    await prismaService.$transaction(async (prisma) => {
      await prisma.diary.deleteMany();
      await prisma.user.deleteMany();
    });
    await prismaService.$disconnect();
    await app.close();
  });
});
