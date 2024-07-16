import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { UserRepositoryPort } from '../../../application/port/out/user-repository.port';
import { User } from '../../../domain/user';
import { RefreshToken } from '../../../domain/refresh-token';

@Injectable()
export class UserRepositoryAdapter implements UserRepositoryPort {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user
      ? new User(
          user.id,
          user.email,
          user.password,
          user.createdAt,
          user.updatedAt,
        )
      : null;
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user
      ? new User(
          user.id,
          user.email,
          user.password,
          user.createdAt,
          user.updatedAt,
        )
      : null;
  }

  async save(user: User): Promise<User> {
    const savedUser = await this.prisma.user.create({
      data: {
        email: user.email,
        password: user.password,
      },
    });
    return new User(
      savedUser.id,
      savedUser.email,
      savedUser.password,
      savedUser.createdAt,
      savedUser.updatedAt,
    );
  }

  async saveRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<RefreshToken> {
    const refreshToken = await this.prisma.refreshToken.upsert({
      where: { userId: userId },
      update: { token: token, expiresAt: expiresAt },
      create: { userId: userId, token: token, expiresAt: expiresAt },
    });
    return new RefreshToken(
      refreshToken.id,
      refreshToken.token,
      refreshToken.userId,
      refreshToken.expiresAt,
      refreshToken.createdAt,
    );
  }

  async findRefreshToken(userId: string): Promise<RefreshToken | null> {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { userId },
    });
    return refreshToken
      ? new RefreshToken(
          refreshToken.id,
          refreshToken.token,
          refreshToken.userId,
          refreshToken.expiresAt,
          refreshToken.createdAt,
        )
      : null;
  }

  async deleteRefreshToken(userId: string): Promise<void> {
    await this.prisma.refreshToken.delete({ where: { userId } });
  }
}
