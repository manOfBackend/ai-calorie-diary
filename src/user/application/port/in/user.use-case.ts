import { User } from '@user/domain/user';

export interface UserUseCase {
  getUserInfo(userId: string): Promise<User>;
  updateTargetCalories(userId: string, targetCalories: number): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(user: User): Promise<User>;
  saveRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<void>;
  findRefreshToken(
    userId: string,
  ): Promise<{ token: string; expiresAt: Date } | null>;
  deleteRefreshToken(userId: string): Promise<void>;
}

export const USER_USE_CASE = Symbol('USER_USE_CASE');
