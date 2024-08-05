import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '@common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { v4 as uuidv4 } from 'uuid';
import { S3Service } from '@common/s3/s3.service';
import { FoodBreakdown } from '@common/dto/Ingredient.dto';

jest.mock('@common/s3/s3.service');
jest.setTimeout(300000);

describe('DiaryController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let s3Service: jest.Mocked<S3Service>;
  let authToken: string;
  let userId: string;
  let userEmail: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(S3Service)
      .useValue({
        uploadFile: jest.fn(),
        deleteFile: jest.fn(),
      })
      .compile();
    app = moduleFixture.createNestApplication();
    await app.init();

    prismaService = app.get(PrismaService);
    jwtService = app.get(JwtService);
    s3Service = app.get(S3Service);
  });

  beforeEach(async () => {
    await prismaService.$transaction(async (prisma) => {
      await prisma.diary.deleteMany();
      await prisma.user.deleteMany();

      userEmail = `test_diary_${uuidv4()}@example.com`;

      const user = await prisma.user.create({
        data: {
          email: userEmail,
          password: 'hashedpassword',
        },
      });
      userId = user.id;

      authToken = jwtService.sign({ sub: user.id, email: user.email });
    });

    // Reset S3Service mock
    jest.resetAllMocks();
  });

  afterEach(async () => {
    // 각 테스트 후 데이터 정리
    await prismaService.$transaction(async (prisma) => {
      await prisma.diary.deleteMany();
      await prisma.user.deleteMany();
    });
  });

  afterAll(async () => {
    await prismaService.$disconnect();
    await app.close();
  });

  describe('/diary (POST)', () => {
    it('should create a new diary entry with nutrition info', () => {
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

      return request(app.getHttpServer())
        .post('/diary')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Test diary content',
          totalCalories: 500,
          calorieBreakdown: calorieBreakdown,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.content).toBe('Test diary content');
          expect(res.body.userId).toBe(userId);
          expect(res.body.totalCalories).toBe(500);
          expect(res.body.calorieBreakdown).toEqual(calorieBreakdown);
        });
    });

    it('should handle file upload with nutrition info', () => {
      const filePath = path.join(__dirname, 'assets', 'icon.png');
      const fileBuffer = fs.readFileSync(filePath);

      const calorieBreakdown = {
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

      return request(app.getHttpServer())
        .post('/diary')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', fileBuffer, 'icon.png')
        .field('content', 'Test diary content with image')
        .field('totalCalories', 500)
        .field('calorieBreakdown', JSON.stringify(calorieBreakdown))
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('imageUrl');
          expect(res.body.content).toBe('Test diary content with image');
          expect(res.body.totalCalories).toBe(500);
          expect(res.body.calorieBreakdown).toEqual(calorieBreakdown);
        });
    });
  });

  describe('/diary (GET)', () => {
    it('should get all diaries for the user', async () => {
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

      // 테스트용 일기 여러 개 생성
      const diariesToCreate = [
        {
          content: 'Test diary content 1',
          userId,
          totalCalories: 500,
          calorieBreakdown: calorieBreakdown,
        },
        {
          content: 'Test diary content 2',
          userId,
          totalCalories: 700,
          calorieBreakdown: calorieBreakdown,
        },
        {
          content: 'Test diary content 3',
          userId,
          totalCalories: 400,
          calorieBreakdown: calorieBreakdown,
        },
      ];

      await prismaService.$transaction(async (prisma) => {
        await Promise.all(
          diariesToCreate.map((diary) => prisma.diary.create({ data: diary })),
        );
      });

      const response = await request(app.getHttpServer())
        .get('/diary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(diariesToCreate.length);

      response.body.forEach((diary, index) => {
        expect(diary).toHaveProperty('id');
        expect(diary).toHaveProperty('content');
        expect(diary.content).toBe(diariesToCreate[index].content);
        expect(diary.userId).toBe(userId);
        expect(diary.totalCalories).toBe(diariesToCreate[index].totalCalories);
        expect(diary.calorieBreakdown).toEqual(
          diariesToCreate[index].calorieBreakdown,
        );
      });

      // 데이터베이스에서 직접 확인
      const diariesInDb = await prismaService.diary.findMany({
        where: { userId },
      });
      expect(diariesInDb.length).toBe(diariesToCreate.length);
    });
  });

  describe('/diary/:id (GET)', () => {
    it('should get a specific diary entry', async () => {
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

      const diary = await prismaService.diary.create({
        data: {
          content: 'Specific diary content',
          userId: userId,
          totalCalories: 500,
          calorieBreakdown: calorieBreakdown,
        },
      });

      return request(app.getHttpServer())
        .get(`/diary/${diary.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(diary.id);
          expect(res.body.content).toBe('Specific diary content');
          expect(res.body.userId).toBe(userId);
          expect(res.body.totalCalories).toBe(500);
          expect(res.body.calorieBreakdown).toEqual(calorieBreakdown);
        });
    });
  });

  describe('/diary/:id (PUT)', () => {
    it('should update a diary entry', async () => {
      const initialCalorieBreakdown: FoodBreakdown = {
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

      const diary = await prismaService.diary.create({
        data: {
          content: 'Original content',
          userId: userId,
          totalCalories: 500,
          calorieBreakdown: initialCalorieBreakdown,
        },
      });

      const updatedCalorieBreakdown: FoodBreakdown = {
        beef: {
          protein: { amount: 26, unit: 'g', calories: 104 },
          fat: { amount: 15, unit: 'g', calories: 135 },
          carbohydrate: { amount: 0, unit: 'g', calories: 0 },
        },
        rice: {
          protein: { amount: 4, unit: 'g', calories: 16 },
          fat: { amount: 0.5, unit: 'g', calories: 4.5 },
          carbohydrate: { amount: 45, unit: 'g', calories: 180 },
        },
      };

      return request(app.getHttpServer())
        .put(`/diary/${diary.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Updated content',
          totalCalories: 600,
          calorieBreakdown: updatedCalorieBreakdown,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(diary.id);
          expect(res.body.content).toBe('Updated content');
          expect(res.body.totalCalories).toBe(600);
          expect(res.body.calorieBreakdown).toEqual(updatedCalorieBreakdown);
        });
    });
  });

  describe('/diary/:id (DELETE)', () => {
    it('should delete a diary entry with image', async () => {
      const mockImageUrl = 'https://example.com/image-to-delete.png';
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

      const diary = await prismaService.diary.create({
        data: {
          content: 'Content to be deleted',
          userId: userId,
          imageUrl: mockImageUrl,
          totalCalories: 500,
          calorieBreakdown: calorieBreakdown,
        },
      });

      s3Service.deleteFile.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete(`/diary/${diary.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const deletedDiary = await prismaService.diary.findUnique({
        where: { id: diary.id },
      });
      expect(deletedDiary).toBeNull();
      expect(s3Service.deleteFile).toHaveBeenCalledWith(mockImageUrl);
    });

    it('should delete a diary entry without image', async () => {
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

      const diary = await prismaService.diary.create({
        data: {
          content: 'Content to be deleted without image',
          userId: userId,
          imageUrl: null,
          totalCalories: 500,
          calorieBreakdown: calorieBreakdown,
        },
      });

      await request(app.getHttpServer())
        .delete(`/diary/${diary.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const deletedDiary = await prismaService.diary.findUnique({
        where: { id: diary.id },
      });
      expect(deletedDiary).toBeNull();
      expect(s3Service.deleteFile).not.toHaveBeenCalled();
    });

    it('should return 404 for deleting non-existent diary', () => {
      return request(app.getHttpServer())
        .delete(`/diary/${uuidv4()}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Authentication and Authorization', () => {
    it('should return 401 when no token is provided', () => {
      return request(app.getHttpServer()).get('/diary').expect(401);
    });

    it('should return 401 when an invalid token is provided', () => {
      return request(app.getHttpServer())
        .get('/diary')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401);
    });

    it("should return 403 when trying to access another user's diary", async () => {
      const otherUser = await prismaService.user.create({
        data: {
          email: 'other@example.com',
          password: 'hashedpassword',
        },
      });

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

      const otherUserDiary = await prismaService.diary.create({
        data: {
          content: "Other user's diary",
          userId: otherUser.id,
          totalCalories: 500,
          calorieBreakdown: calorieBreakdown,
        },
      });

      return request(app.getHttpServer())
        .get(`/diary/${otherUserDiary.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('Input Validation', () => {
    it.skip('should return 400 when creating a diary with invalid data', () => {
      return request(app.getHttpServer())
        .post('/diary')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '', // Empty content
          totalCalories: 'not a number', // Should be a number
          calorieBreakdown: 'not an object', // Should be an object
        })
        .expect(400);
    });

    it.skip('should return 400 when updating a diary with invalid data', async () => {
      const diary = await prismaService.diary.create({
        data: {
          content: 'Original content',
          userId: userId,
          totalCalories: 500,
          calorieBreakdown: {},
        },
      });

      return request(app.getHttpServer())
        .put(`/diary/${diary.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '', // Empty content
          totalCalories: 'not a number', // Should be a number
          calorieBreakdown: 'not an object', // Should be an object
        })
        .expect(400);
    });
  });

  describe('Edge Cases', () => {
    it('should handle creating a diary with maximum allowed content length', async () => {
      const maxContentLength = 10000; // Adjust this based on your actual max length
      const longContent = 'a'.repeat(maxContentLength);

      const response = await request(app.getHttpServer())
        .post('/diary')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: longContent,
          totalCalories: 100,
          calorieBreakdown: {},
        })
        .expect(201);

      expect(response.body.content).toBe(longContent);
    });

    it('should handle creating a diary with very precise calorie values', async () => {
      const preciseTotalCalories = 123.45678;
      const preciseCalorieBreakdown: FoodBreakdown = {
        ingredient: {
          protein: { amount: 10.12345, unit: 'g', calories: 40.4938 },
          fat: { amount: 5.6789, unit: 'g', calories: 51.1101 },
          carbohydrate: { amount: 15.13579, unit: 'g', calories: 60.54316 },
        },
      };

      const response = await request(app.getHttpServer())
        .post('/diary')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Diary with precise calories',
          totalCalories: preciseTotalCalories,
          calorieBreakdown: preciseCalorieBreakdown,
        })
        .expect(201);

      expect(response.body.totalCalories).toBeCloseTo(preciseTotalCalories, 5);
      expect(response.body.calorieBreakdown).toEqual(preciseCalorieBreakdown);
    });
  });
});
