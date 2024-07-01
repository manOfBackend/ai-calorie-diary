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
    try {
      const command = new LoginCommand(loginDto.email, loginDto.password);
      const { accessToken, refreshToken } = await this.authUseCase.login(
        command,
      );

      // Set cookies
      response.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      });
      response.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/auth/refresh', // Only send the refresh token for refresh requests
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return response
        .status(HttpStatus.OK)
        .json({ message: 'Login successful' });
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  @ApiOperation({ summary: '토큰 갱신' })
  @ApiResponse({ status: 200, description: '토큰 갱신 성공' })
  @ApiResponse({ status: 401, description: '토큰 갱신 실패' })
  @Post('refresh')
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const command = new RefreshTokenCommand(refreshTokenDto.refreshToken);
      const { accessToken, refreshToken } = await this.authUseCase.refreshToken(
        command,
      );

      // Set new cookies
      response.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      });
      response.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/auth/refresh',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return response
        .status(HttpStatus.OK)
        .json({ message: 'Token refreshed successfully' });
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @ApiOperation({ summary: '사용자 등록' })
  @ApiResponse({ status: 200, description: '등록 성공' })
  @ApiResponse({ status: 401, description: '등록 실패' })
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    try {
      const command = new RegisterCommand(
        registerDto.email,
        registerDto.password,
      );
      const user = await this.authUseCase.register(command);
      return { id: user.id, email: user.email };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new UnauthorizedException('Registration failed');
    }
  }
}
