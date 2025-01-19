import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthUseCase } from '@auth/application/port/in/auth.use-case';
import { LoginCommand } from '@auth/application/port/in/dto/login.command';
import { User } from '@user/domain/user';
import { RefreshTokenCommand } from '@auth/application/port/in/dto/refresh-token.command';
import { RegisterCommand } from '@auth/application/port/in/dto/register.command';
import {
  USER_USE_CASE,
  UserUseCase,
} from '@user/application/port/in/user.use-case';

@Injectable()
export class AuthService implements AuthUseCase {
  constructor(
    @Inject(USER_USE_CASE)
    private readonly userService: UserUseCase,
    private readonly jwtService: JwtService,
  ) {}

  async login(command: LoginCommand): ReturnType<AuthUseCase['login']> {
    const user = await this.userService.findByEmail(command.email);
    if (!user || !(await bcrypt.compare(command.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken, accessTokenExpiresAt } =
      await this.generateTokens(user);

    return { accessToken, refreshToken, user, accessTokenExpiresAt };
  }

  async register(
    command: RegisterCommand,
  ): ReturnType<AuthUseCase['register']> {
    const existingUser = await this.userService.findByEmail(command.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(command.password, 10);
    const user = new User(
      null,
      command.email,
      hashedPassword,
      2000,
      new Date(),
      new Date(),
    );
    const savedUser = await this.userService.create(user);
    const { accessToken, refreshToken } = await this.generateTokens(savedUser);

    return { user: savedUser, accessToken, refreshToken };
  }

  async refreshToken(
    command: RefreshTokenCommand,
  ): ReturnType<AuthUseCase['refreshToken']> {
    try {
      const payload = this.jwtService.verify(command.refreshToken);
      // const storedToken = await this.userService.findRefreshToken(payload.sub);
      //
      // if (
      //   !storedToken ||
      //   storedToken.token !== command.refreshToken ||
      //   storedToken.expiresAt < new Date()
      // ) {
      //   throw new UnauthorizedException('Invalid refresh token');
      // }
      //
      // await this.userService.deleteRefreshToken(payload.sub);

      const user = await this.userService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return await this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): ReturnType<AuthUseCase['logout']> {
    await this.userService.deleteRefreshToken(userId);
  }

  private async generateTokens(user: User): Promise<{
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: number;
  }> {
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7);

    await this.userService.saveRefreshToken(
      user.id,
      refreshToken,
      refreshExpiresAt,
    );

    const accessTokenExpiresAt = new Date();
    accessTokenExpiresAt.setMinutes(accessTokenExpiresAt.getMinutes() + 1);
    // accessTokenExpiresAt.setSeconds(accessTokenExpiresAt.getSeconds() + 10);
    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt: accessTokenExpiresAt.getTime(),
    };
  }
}
