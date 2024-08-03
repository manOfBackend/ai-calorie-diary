import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '@common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

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
    await prismaService.user.deleteMany();
  });

  afterAll(async () => {
    await prismaService.user.deleteMany();
    await prismaService.$disconnect();
    await app.close();
  });

  it('/auth/register (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('email', 'test@example.com');
    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
  });

  it('/auth/login (POST) - successful login', async () => {
    // 먼저 사용자를 등록합니다
    const password = 'password123';
    const email = 'test_login@example.com';
    const hashedPassword = await bcrypt.hash(password, 10);
    await prismaService.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.user).toHaveProperty('email', email);
  });

  it('/auth/login (POST) - invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'wrong@example.com', password: 'wrongpassword' })
      .expect(401);
  });

  it('/auth/refresh (POST) - successful token refresh', async () => {
    // 먼저 사용자를 등록하고 로그인합니다
    const password = 'password123';
    const email = 'test@example.com';
    const hashedPassword = await bcrypt.hash(password, 10);
    await prismaService.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    const { refreshToken } = loginResponse.body;

    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(refreshResponse.body).toHaveProperty('accessToken');
    expect(refreshResponse.body).toHaveProperty('refreshToken');
  });

  it('/auth/refresh (POST) - invalid refresh token', async () => {
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'invalid_token' })
      .expect(401);
  });

  it('/auth/logout (POST) - logout user', async () => {
    // 사용자 등록 및 로그인
    const password = 'password123';
    const email = 'test_logout@example.com';
    const hashedPassword = await bcrypt.hash(password, 10);
    await prismaService.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    const { accessToken } = loginResponse.body;

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // 로그아웃 후 /me 엔드포인트에 접근 시 401 에러가 발생해야 함
    // await request(app.getHttpServer())
    //   .get('/auth/me')
    //   .set('Authorization', `Bearer ${accessToken}`)
    //   .expect(401);
  });
});
