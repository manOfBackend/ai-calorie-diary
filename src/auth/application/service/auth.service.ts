import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  USER_REPOSITORY_PORT,
  UserRepositoryPort,
} from '@auth/application/port/out/user-repository.port';
import { AuthUseCase } from '@auth/application/port/in/auth.use-case';
import { LoginCommand } from '@auth/application/port/in/dto/login.command';
import { User } from '@auth/domain/user';
import { RefreshTokenCommand } from '@auth/application/port/in/dto/refresh-token.command';
import { RegisterCommand } from '@auth/application/port/in/dto/register.command';

@Injectable()
export class AuthService implements AuthUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
    private readonly jwtService: JwtService,
  ) {}

  async login(
    command: LoginCommand,
  ): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    const user = await this.userRepository.findByEmail(command.email);

    if (!user || !(await bcrypt.compare(command.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken } = await this.generateTokens(user);

    return { accessToken, refreshToken, user };
  }

  async refreshToken(
    command: RefreshTokenCommand,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify(command.refreshToken);
      const storedToken = await this.userRepository.findRefreshToken(
        payload.sub,
      );

      if (
        !storedToken ||
        storedToken.token !== command.refreshToken ||
        storedToken.expiresAt < new Date()
      ) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      await this.userRepository.deleteRefreshToken(payload.sub);

      const user = await this.userRepository.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return await this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async register(
    command: RegisterCommand,
  ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const existingUser = await this.userRepository.findByEmail(command.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(command.password, 10);
    const user = new User(
      null,
      command.email,
      hashedPassword,
      new Date(),
      new Date(),
    );

    const savedUser = await this.userRepository.save(user);
    const { accessToken, refreshToken } = await this.generateTokens(savedUser);

    return { user: savedUser, accessToken, refreshToken };
  }

  async logout(userId: string): Promise<void> {
    await this.userRepository.deleteRefreshToken(userId);
  }

  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.userRepository.saveRefreshToken(
      user.id,
      refreshToken,
      expiresAt,
    );

    return { accessToken, refreshToken };
  }
}
