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
    it('should create a new diary entry without image', () => {
      return request(app.getHttpServer())
        .post('/diary')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Test diary content',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.content).toBe('Test diary content');
          expect(res.body.userId).toBe(userId);
        });
    });

    it('should handle file upload', () => {
      const filePath = path.join(__dirname, 'assets', 'icon.png');
      const fileBuffer = fs.readFileSync(filePath);

      return request(app.getHttpServer())
        .post('/diary')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', fileBuffer, 'icon.png')
        .field('content', 'Test diary content with image')
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('imageUrl');
          expect(res.body.content).toBe('Test diary content with image');
        });
    });
  });

  describe('/diary (GET)', () => {
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

  describe('/diary/:id (PUT)', () => {
    it('should update a diary entry', async () => {
      const diary = await prismaService.diary.create({
        data: {
          content: 'Original content',
          userId: userId,
        },
      });

      return request(app.getHttpServer())
        .put(`/diary/${diary.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Updated content',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(diary.id);
          expect(res.body.content).toBe('Updated content');
        });
    });
  });
  describe('/diary/:id (DELETE)', () => {
    it('should delete a diary entry with image', async () => {
      const mockImageUrl = 'https://example.com/image-to-delete.png';
      const diary = await prismaService.diary.create({
        data: {
          content: 'Content to be deleted',
          userId: userId,
          imageUrl: mockImageUrl,
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
      const diary = await prismaService.diary.create({
        data: {
          content: 'Content to be deleted without image',
          userId: userId,
          imageUrl: null, // 명시적으로 null 설정
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
});
