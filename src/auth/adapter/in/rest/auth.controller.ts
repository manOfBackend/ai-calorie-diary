import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import {
  AUTH_USE_CASE,
  AuthUseCase,
} from '@auth/application/port/in/auth.use-case';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LoginCommand } from '@auth/application/port/in/dto/login.command';
import { RefreshTokenCommand } from '@auth/application/port/in/dto/refresh-token.command';
import { RegisterCommand } from '@auth/application/port/in/dto/register.command';
import { RegisterDto } from './dto/register.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ErrorResponseDto } from '@common/dto/error-response.dto';
import { AuthGuard } from '@nestjs/passport';
import { OAuthSignupDto } from '@auth/adapter/in/rest/dto/oauth-signup.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AUTH_USE_CASE)
    private readonly authService: AuthUseCase,
  ) {}

  @ApiOperation({ summary: '사용자 로그인' })
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
    schema: {
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    type: ErrorResponseDto,
  })
  @ApiBody({ type: LoginDto })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    try {
      const command = new LoginCommand(loginDto.email, loginDto.password);
      const { accessToken, refreshToken, user } = await this.authService.login(
        command,
      );
      return {
        accessToken,
        refreshToken,
        user: { id: user.id, email: user.email },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    const { accessToken } = await this.authService.oauthLogin(
      'google',
      req.user.accessToken,
      req.user.refreshToken,
      req.user,
    );
    res.redirect(`/dashboard?token=${accessToken}`);
  }

  @Post('oauth/signup')
  async oauthSignup(@Body() oauthSignupDto: OAuthSignupDto) {
    const { user, accessToken, refreshToken } =
      await this.authService.oauthSignup(oauthSignupDto);
    return { user, accessToken, refreshToken };
  }

  @ApiOperation({ summary: '토큰 갱신' })
  @ApiResponse({
    status: 200,
    description: '토큰 갱신 성공',
    schema: {
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: '토큰 갱신 실패' })
  @ApiBody({ type: RefreshTokenDto })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    try {
      const command = new RefreshTokenCommand(refreshTokenDto.refreshToken);
      const { accessToken, refreshToken } = await this.authService.refreshToken(
        command,
      );
      return { accessToken, refreshToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @ApiOperation({ summary: '사용자 등록' })
  @ApiResponse({
    status: 201,
    description: '사용자 등록 성공',
    schema: {
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: '이미 존재하는 이메일',
    type: ErrorResponseDto,
  })
  @ApiBody({ type: RegisterDto })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    try {
      const command = new RegisterCommand(
        registerDto.email,
        registerDto.password,
      );
      const { user, accessToken, refreshToken } =
        await this.authService.register(command);
      return {
        id: user.id,
        email: user.email,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Registration failed');
    }
  }

  @ApiOperation({ summary: '로그아웃' })
  @ApiResponse({ status: 200, description: '로그아웃 성공' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request) {
    const userId = req.user['id'];
    await this.authService.logout(userId);
    return { message: 'Logout successful' };
  }
}
