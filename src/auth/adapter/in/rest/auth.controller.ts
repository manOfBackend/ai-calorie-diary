import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { AuthUseCase } from '../../../application/port/in/auth.use-case';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LoginCommand } from '../../../application/port/in/dto/login.command';
import { RefreshTokenCommand } from '../../../application/port/in/dto/refresh-token.command';

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
}
