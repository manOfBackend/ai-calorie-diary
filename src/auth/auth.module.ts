import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { PrismaService } from '@common/prisma/prisma.service';
import { JwtStrategy } from '@common/strategies/jwt.strategy';
import { AuthController } from '@auth/adapter/in/rest/auth.controller';
import { AUTH_USE_CASE } from '@auth/application/port/in/auth.use-case';
import { AuthService } from '@auth/application/service/auth.service';
import { UserModule } from '@user/user.module';
import { MetricsModule } from '@common/metrics/metrics.module';

@Module({
  imports: [
    MetricsModule,
    UserModule,
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
      provide: AUTH_USE_CASE,
      useClass: AuthService,
    },
    JwtStrategy,
  ],
  exports: [AUTH_USE_CASE],
})
export class AuthModule {}
