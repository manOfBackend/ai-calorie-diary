// test/diary.e2e-spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as path from 'node:path';
import * as fs from 'node:fs';

jest.setTimeout(300000);
describe('DiaryController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaService = app.get(PrismaService);
    jwtService = app.get(JwtService);
  });

  beforeEach(async () => {
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
      userId = user.id;

      // JWT 토큰 생성
      authToken = jwtService.sign({ sub: user.id, email: user.email });
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

  describe('/diary (POST)', () => {
    it('should create a new diary entry without image', () => {
      return request(app.getHttpServer())
        .post('/diary')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Test diary content',
        })
        .expect(201)
        .expect((res) => {
          console.log(res.body);
          expect(res.body).toHaveProperty('id');
          expect(res.body.content).toBe('Test diary content');
          expect(res.body.userId).toBe(userId);
        });
    });

    // 파일 업로드 테스트를 별도로 진행
    it.skip('should handle file upload', () => {
      const filePath = path.join(__dirname, 'assets', 'icon.png');
      const fileBuffer = fs.readFileSync(filePath);

      return request(app.getHttpServer())
        .post('/diary')
        .set('Authorization', `Bearer ${authToken}`)
        .field('image', fileBuffer)
        .field('content', 'Test diary content with image')
        .expect(201)
        .expect((res) => {
          console.log(res.body);
          expect(res.body).toHaveProperty('imageUrl');
        });
    });
  });

  describe.skip('/diary (GET)', () => {
    it('should get all diaries for the user', async () => {
      // 테스트용 일기 생성
      await prismaService.diary.create({
        data: {
          content: 'Test diary content',
          userId: userId,
        },
      });

      return request(app.getHttpServer())
        .get('/diary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('content');
          expect(res.body[0].userId).toBe(userId);
        });
    });
  });

  describe('/diary/:id (GET)', () => {
    it('should get a specific diary entry', async () => {
      const diary = await prismaService.diary.create({
        data: {
          content: 'Specific diary content',
          userId: userId,
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
        });
    });
  });
});
