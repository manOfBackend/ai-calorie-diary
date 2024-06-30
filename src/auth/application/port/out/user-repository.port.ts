import { User } from '../../../domain/user';
import { RefreshToken } from '../../../domain/refresh-token';

export interface UserRepositoryPort {
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  saveRefreshToken(
    userId: number,
    token: string,
    expiresAt: Date,
  ): Promise<RefreshToken>;
  findRefreshToken(userId: number): Promise<RefreshToken | null>;
  deleteRefreshToken(userId: number): Promise<void>;
}
