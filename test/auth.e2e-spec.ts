import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
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

    expect(response.body).toEqual({ message: 'Login successful' });

    // 쿠키 확인
    const cookies = response.headers['set-cookie'];
    expect(cookies).toBeDefined();
    if (Array.isArray(cookies)) {
      expect(
        cookies.some((cookie: string) => cookie.includes('accessToken')),
      ).toBe(true);
      expect(
        cookies.some((cookie: string) => cookie.includes('refreshToken')),
      ).toBe(true);
    } else if (typeof cookies === 'string') {
      expect(cookies.includes('accessToken')).toBe(true);
      expect(cookies.includes('refreshToken')).toBe(true);
    }
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
    const hashedPassword = await bcrypt.hash(password, 10);
    await prismaService.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
      },
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(200);

    const cookies = loginResponse.headers['set-cookie'];
    let refreshTokenCookie: string;
    let refreshToken: string;

    if (Array.isArray(cookies)) {
      refreshTokenCookie =
        cookies.find((cookie: string) => cookie.includes('refreshToken')) || '';
      refreshToken = refreshTokenCookie.split(';')[0].split('=')[1];
    } else if (typeof cookies === 'string') {
      refreshTokenCookie = cookies;
      refreshToken =
        cookies
          .split(';')
          .find((c) => c.includes('refreshToken'))
          ?.split('=')[1] || '';
    } else {
      throw new Error('Unexpected cookies format');
    }

    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', refreshTokenCookie)
      .send({ refreshToken })
      .expect(200);

    expect(refreshResponse.body).toEqual({
      message: 'Token refreshed successfully',
    });

    // 새로운 쿠키 확인
    const newCookies = refreshResponse.headers['set-cookie'];
    expect(newCookies).toBeDefined();
    if (Array.isArray(newCookies)) {
      expect(
        newCookies.some((cookie: string) => cookie.includes('accessToken')),
      ).toBe(true);
      expect(
        newCookies.some((cookie: string) => cookie.includes('refreshToken')),
      ).toBe(true);
    } else if (typeof newCookies === 'string') {
      expect(newCookies.includes('accessToken')).toBe(true);
      expect(newCookies.includes('refreshToken')).toBe(true);
    }
  });

  it('/auth/refresh (POST) - invalid refresh token', async () => {
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'invalid_token' })
      .expect(401);
  });
});
