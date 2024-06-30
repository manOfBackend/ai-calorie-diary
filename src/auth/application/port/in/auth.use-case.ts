import { LoginCommand } from './dto/login.command';
import { RefreshTokenCommand } from './dto/refresh-token.command';
import { RegisterCommand } from './dto/register.command';
import { User } from '../../../domain/user';

export interface AuthUseCase {
  login(
    command: LoginCommand,
  ): Promise<{ accessToken: string; refreshToken: string }>;
  refreshToken(
    command: RefreshTokenCommand,
  ): Promise<{ accessToken: string; refreshToken: string }>;
  register(command: RegisterCommand): Promise<User>;
}
