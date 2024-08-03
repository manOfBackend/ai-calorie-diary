// src/user/user.module.ts

import { Module } from '@nestjs/common';
import { UserController } from './adapter/in/rest/user.controller';
import { UserService } from './application/service/user.service';
import { USER_REPOSITORY_PORT } from './application/port/out/user-repository.port';
import { UserRepositoryAdapter } from './adapter/out/persistence/user-repository.adapter';
import { PrismaModule } from '@common/prisma/prisma.module';
import { USER_USE_CASE } from '@user/application/port/in/user.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [
    {
      provide: USER_USE_CASE,
      useClass: UserService,
    },
    {
      provide: USER_REPOSITORY_PORT,
      useClass: UserRepositoryAdapter,
    },
  ],
  exports: [USER_USE_CASE, USER_REPOSITORY_PORT],
})
export class UserModule {}
