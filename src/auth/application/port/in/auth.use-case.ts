import { LoginCommand } from './dto/login.command';
import { RefreshTokenCommand } from './dto/refresh-token.command';
import { RegisterCommand } from './dto/register.command';
import { User } from '@user/domain/user';

export const AUTH_USE_CASE = 'AUTH_USE_CASE';

export interface AuthUseCase {
  login(
    command: LoginCommand,
  ): Promise<{ accessToken: string; refreshToken: string; user: User }>;
  refreshToken(
    command: RefreshTokenCommand,
  ): Promise<{ accessToken: string; refreshToken: string }>;
  register(
    command: RegisterCommand,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }>;
  logout(userId: string): Promise<void>;
}
