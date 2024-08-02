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

describe('FoodController (e2e)', () => {
  let app: INestApplication;
  let mockFoodUseCase: Partial<FoodUseCase>;

  beforeEach(async () => {
    mockFoodUseCase = {
      analyzeFoodImage: jest.fn().mockResolvedValue(
        new FoodAnalysis(['chicken', 'salad'], 350, {
          chicken: 250,
          salad: 100,
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
  });

  it('/food/analyze (POST)', () => {
    const filePath = path.join(__dirname, 'assets', 'mac.png');

    return request(app.getHttpServer())
      .post('/food/analyze')
      .attach('image', filePath)
      .field('description', '치킨 샐러드')
      .expect(201)
      .expect((res) => {
        expect(res.body).toEqual({
          ingredients: ['chicken', 'salad'],
          totalCalories: 350,
          breakdown: { chicken: 250, salad: 100 },
        });
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
