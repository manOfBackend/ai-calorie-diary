import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthUseCase } from '../port/in/auth.use-case';
import { UserRepositoryPort } from '../port/out/user-repository.port';
import { LoginCommand } from '../port/in/dto/login.command';
import { RefreshTokenCommand } from '../port/in/dto/refresh-token.command';
import { RegisterCommand } from '../port/in/dto/register.command';
import { User } from '../../domain/user';

@Injectable()
export class AuthService implements AuthUseCase {
  constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
    private readonly jwtService: JwtService,
  ) {}

  async login(
    command: LoginCommand,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userRepository.findByEmail(command.email);
    if (!user || !(await bcrypt.compare(command.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '9d' });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 9);
    await this.userRepository.saveRefreshToken(
      user.id,
      refreshToken,
      expiresAt,
    );

    return { accessToken, refreshToken };
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

      const newPayload = { sub: payload.sub, email: payload.email };
      const accessToken = this.jwtService.sign(newPayload);
      const refreshToken = this.jwtService.sign(newPayload, {
        expiresIn: '7d',
      });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      await this.userRepository.saveRefreshToken(
        payload.sub,
        refreshToken,
        expiresAt,
      );

      return { accessToken, refreshToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async register(command: RegisterCommand): Promise<User> {
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

    return this.userRepository.save(user);
  }
}
