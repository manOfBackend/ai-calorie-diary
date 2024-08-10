import { User } from '@user/domain/user';
import { RefreshToken } from '@auth/domain/refresh-token';

export interface UserRepositoryPort {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: User): Promise<User>;
  save(user: User): Promise<User>;
  updateTargetCalories(id: string, targetCalories: number): Promise<User>;
  saveRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<RefreshToken>;
  findRefreshToken(userId: string): Promise<RefreshToken | null>;
  deleteRefreshToken(userId: string): Promise<void>;
}
export const USER_REPOSITORY_PORT = Symbol('USER_REPOSITORY_PORT');
