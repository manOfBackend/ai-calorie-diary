import { LoginCommand } from './dto/login.command';
import { RefreshTokenCommand } from './dto/refresh-token.command';

export interface AuthUseCase {
  login(
    command: LoginCommand,
  ): Promise<{ accessToken: string; refreshToken: string }>;
  refreshToken(
    command: RefreshTokenCommand,
  ): Promise<{ accessToken: string; refreshToken: string }>;
}
