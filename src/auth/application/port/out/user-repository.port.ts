import { User } from '../../../domain/user';
import { RefreshToken } from '../../../domain/refresh-token';

export interface UserRepositoryPort {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<User>;
  saveRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<RefreshToken>;
  findRefreshToken(userId: string): Promise<RefreshToken | null>;
  deleteRefreshToken(userId: string): Promise<void>;
}
