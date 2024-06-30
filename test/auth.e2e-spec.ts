import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prismaService = app.get(PrismaService);
  });

  beforeEach(async () => {
    // 각 테스트 전에 데이터베이스 초기화
    await prismaService.user.deleteMany();
  });

  afterAll(async () => {
    await prismaService.user.deleteMany();
    await app.close();
  });

  it('/auth/register (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('email', 'test@example.com');
  });

  it('/auth/register (POST) - email already exists', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'duplicate@example.com', password: 'password123' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'duplicate@example.com', password: 'password123' })
      .expect(409);
  });

  it('/auth/login (POST)', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'login@example.com', password: 'password123' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'login@example.com', password: 'password123' })
      .expect(201);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
  });

  it('/auth/login (POST) - invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'wrong@example.com', password: 'wrongpassword' })
      .expect(401);
  });

  // Add more tests for refreshToken endpoint
});
