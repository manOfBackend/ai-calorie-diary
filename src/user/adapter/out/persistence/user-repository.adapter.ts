import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { UserRepositoryPort } from '@user/application/port/out/user-repository.port';
import { User } from '@user/domain/user';
import { RefreshToken } from '@auth/domain/refresh-token';

@Injectable()
export class UserRepositoryAdapter implements UserRepositoryPort {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.mapToUser(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user ? this.mapToUser(user) : null;
  }

  async create(user: User): Promise<User> {
    const createdUser = await this.prisma.user.create({
      data: {
        email: user.email,
        password: user.password,
        targetCalories: user.targetCalories,
      },
    });
    return this.mapToUser(createdUser);
  }

  async save(user: User): Promise<User> {
    console.log(user);
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          email: user.email,
          password: user.password,
          targetCalories: user.targetCalories,
        },
      });
      return this.mapToUser(updatedUser);
    } catch (e) {
      console.log(e);
    }
  }

  async updateTargetCalories(
    id: string,
    targetCalories: number,
  ): Promise<User> {
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { targetCalories },
    });
    return this.mapToUser(updatedUser);
  }

  async saveRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<RefreshToken> {
    const refreshToken = await this.prisma.refreshToken.upsert({
      where: { userId },
      update: { token, expiresAt },
      create: { userId, token, expiresAt },
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
    await this.prisma.refreshToken.delete({
      where: { userId },
    });
  }

  private mapToUser(userData: any): User {
    return new User(
      userData.id,
      userData.email,
      userData.password,
      userData.targetCalories,
      userData.createdAt,
      userData.updatedAt,
    );
  }
}
