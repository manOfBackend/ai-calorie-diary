import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Inject,
  ConflictException,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Effect, pipe } from 'effect';
import { AuthUseCase } from '../../../application/port/in/auth.use-case';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LoginCommand } from '../../../application/port/in/dto/login.command';
import { RefreshTokenCommand } from '../../../application/port/in/dto/refresh-token.command';
import { RegisterCommand } from '../../../application/port/in/dto/register.command';
import { RegisterDto } from './dto/register.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AuthUseCase')
    private readonly authUseCase: AuthUseCase,
  ) {}

  @ApiOperation({ summary: '사용자 로그인' })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const loginEffect = pipe(
      Effect.tryPromise(() => {
        const command = new LoginCommand(loginDto.email, loginDto.password);
        return this.authUseCase.login(command);
      }),
      Effect.map(({ accessToken, refreshToken }) => {
        response.cookie('accessToken', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
        });
        response.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          path: '/auth/refresh',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        response.status(HttpStatus.OK);
        return { message: 'Login successful' };
      }),
      Effect.catchAll(() =>
        Effect.fail(new UnauthorizedException('Invalid credentials')),
      ),
    );

    return Effect.runPromise(loginEffect);
  }

  @ApiOperation({ summary: '토큰 갱신' })
  @ApiResponse({ status: 200, description: '토큰 갱신 성공' })
  @ApiResponse({ status: 401, description: '토큰 갱신 실패' })
  @Post('refresh')
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshEffect = pipe(
      Effect.tryPromise(() => {
        const command = new RefreshTokenCommand(refreshTokenDto.refreshToken);
        return this.authUseCase.refreshToken(command);
      }),
      Effect.map(({ accessToken, refreshToken }) => {
        response.cookie('accessToken', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
        });
        response.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          path: '/auth/refresh',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        response.status(HttpStatus.OK);
        return { message: 'Token refreshed successfully' };
      }),
      Effect.catchAll(() =>
        Effect.fail(new UnauthorizedException('Invalid refresh token')),
      ),
    );

    return Effect.runPromise(refreshEffect);
  }

  @ApiOperation({ summary: '사용자 등록' })
  @ApiResponse({ status: 200, description: '등록 성공' })
  @ApiResponse({ status: 401, description: '등록 실패' })
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const registerEffect = pipe(
      Effect.tryPromise(() => {
        const command = new RegisterCommand(
          registerDto.email,
          registerDto.password,
        );
        return this.authUseCase.register(command);
      }),
      Effect.map((user) => ({ id: user.id, email: user.email })),
      Effect.catchAll((error) =>
        error instanceof ConflictException
          ? Effect.fail(error)
          : Effect.fail(new UnauthorizedException('Registration failed')),
      ),
    );

    return Effect.runPromise(registerEffect);
  }
}
