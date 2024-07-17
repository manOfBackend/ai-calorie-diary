import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './adapter/in/rest/auth.controller';
import { AuthService } from './application/service/auth.service';
import { UserRepositoryAdapter } from './adapter/out/persistence/user-repository.adapter';
import { PrismaService } from '../common/prisma/prisma.service';
import { JwtStrategy } from '../common/strategies/jwt.strategy';
import { AUTH_USE_CASE } from './application/port/in/auth.use-case';
import { USER_REPOSITORY_PORT } from './application/port/out/user-repository.port';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [
    PrismaService,
    {
      provide: USER_REPOSITORY_PORT,
      useClass: UserRepositoryAdapter,
    },
    {
      provide: AUTH_USE_CASE,
      useClass: AuthService,
    },
    JwtStrategy,
  ],
  exports: [AUTH_USE_CASE],
})
export class AuthModule {}
