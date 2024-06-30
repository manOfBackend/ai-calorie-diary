import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthUseCase } from '../../../application/port/in/auth.use-case';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { User } from '../../../domain/user';
import { Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authUseCaseMock: jest.Mocked<AuthUseCase>;

  beforeEach(async () => {
    const authUseCaseMockFactory: () => MockType<AuthUseCase> = jest.fn(() => ({
      login: jest.fn(),
      refreshToken: jest.fn(),
      register: jest.fn(),
    }));

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: 'AuthUseCase', useFactory: authUseCaseMockFactory },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authUseCaseMock = module.get('AuthUseCase');
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const user = new User(
        1,
        registerDto.email,
        'hashedPassword',
        new Date(),
        new Date(),
      );

      authUseCaseMock.register.mockResolvedValue(user);

      const result = await controller.register(registerDto);

      expect(result).toEqual({ id: user.id, email: user.email });
      expect(authUseCaseMock.register).toHaveBeenCalledWith(
        expect.objectContaining(registerDto),
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      authUseCaseMock.register.mockRejectedValue(
        new ConflictException('Email already exists'),
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const loginDto = { email: 'test@example.com', password: 'password123' };
      const tokens = {
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      };

      authUseCaseMock.login.mockResolvedValue(tokens);

      const mockResponse = {
        cookie: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await controller.login(loginDto, mockResponse);

      expect(authUseCaseMock.login).toHaveBeenCalledWith(
        expect.objectContaining(loginDto),
      );
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Login successful',
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const loginDto = { email: 'test@example.com', password: 'wrongpassword' };

      authUseCaseMock.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      const mockResponse = {} as Response;

      await expect(controller.login(loginDto, mockResponse)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      const refreshTokenDto = { refreshToken: 'validRefreshToken' };
      const newTokens = {
        accessToken: 'newAccessToken',
        refreshToken: 'newRefreshToken',
      };

      authUseCaseMock.refreshToken.mockResolvedValue(newTokens);

      const mockResponse = {
        cookie: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await controller.refreshToken(refreshTokenDto, mockResponse);

      expect(authUseCaseMock.refreshToken).toHaveBeenCalledWith(
        expect.objectContaining(refreshTokenDto),
      );
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Token refreshed successfully',
      });
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      const refreshTokenDto = { refreshToken: 'invalidRefreshToken' };

      authUseCaseMock.refreshToken.mockRejectedValue(
        new UnauthorizedException('Invalid refresh token'),
      );

      const mockResponse = {} as Response;

      await expect(
        controller.refreshToken(refreshTokenDto, mockResponse),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});

type MockType<T> = {
  [P in keyof T]: jest.Mock<any>;
};
