import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Inject,
  ConflictException,
} from '@nestjs/common';
import { AuthUseCase } from '../../../application/port/in/auth.use-case';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LoginCommand } from '../../../application/port/in/dto/login.command';
import { RefreshTokenCommand } from '../../../application/port/in/dto/refresh-token.command';
import { RegisterCommand } from '../../../application/port/in/dto/register.command';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AuthUseCase')
    private readonly authUseCase: AuthUseCase,
  ) {}
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const command = new LoginCommand(loginDto.email, loginDto.password);
      return await this.authUseCase.login(command);
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  @Post('refresh')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    try {
      const command = new RefreshTokenCommand(refreshTokenDto.refreshToken);
      return await this.authUseCase.refreshToken(command);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

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
