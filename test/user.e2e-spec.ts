// test/user.e2e-spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@common/prisma/prisma.service';
import { User } from '@user/domain/user';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let prismaService: PrismaService;
  let testUser: User;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = app.get(JwtService);
    prismaService = app.get(PrismaService);

    // 테스트용 사용자 생성
    testUser = await prismaService.user.create({
      data: {
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
        provider: 'local',
        providerId: null,
        profilePicture: null,
        targetCalories: 2000,
      },
    });

    // JWT 토큰 생성
    authToken = jwtService.sign({ sub: testUser.id, email: testUser.email });
  });

  afterAll(async () => {
    // 테스트용 사용자 삭제
    await prismaService.user.delete({ where: { id: testUser.id } });
    await app.close();
  });

  describe('/user/info (GET)', () => {
    it('should return user info', () => {
      return request(app.getHttpServer())
        .get('/user/info')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', testUser.id);
          expect(res.body).toHaveProperty('email', testUser.email);
          expect(res.body).toHaveProperty('firstName', testUser.firstName);
          expect(res.body).toHaveProperty('lastName', testUser.lastName);
          expect(res.body).toHaveProperty('provider', testUser.provider);
          expect(res.body).toHaveProperty('providerId', testUser.providerId);
          expect(res.body).toHaveProperty(
            'profilePicture',
            testUser.profilePicture,
          );
          expect(res.body).toHaveProperty(
            'targetCalories',
            testUser.targetCalories,
          );
          expect(res.body).toHaveProperty('createdAt');
          expect(res.body).toHaveProperty('updatedAt');
        });
    });

    it('should return 401 Unauthorized when no token is provided', () => {
      return request(app.getHttpServer()).get('/user/info').expect(401);
    });
  });

  describe('/user/target-calories (PUT)', () => {
    it('should update target calories', () => {
      const newTargetCalories = 2500;
      return request(app.getHttpServer())
        .put('/user/target-calories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ targetCalories: newTargetCalories })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty(
            'message',
            'Target calories updated successfully',
          );
          expect(res.body).toHaveProperty('targetCalories', newTargetCalories);
        });
    });

    it('should return 400 Bad Request when invalid calories are provided', () => {
      return request(app.getHttpServer())
        .put('/user/target-calories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ targetCalories: 499 }) // 최소값 미만
        .expect(400);
    });

    it('should return 401 Unauthorized when no token is provided', () => {
      return request(app.getHttpServer())
        .put('/user/target-calories')
        .send({ targetCalories: 2500 })
        .expect(401);
    });
  });
});
