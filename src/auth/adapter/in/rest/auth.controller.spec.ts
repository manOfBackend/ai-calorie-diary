import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import {
  AUTH_USE_CASE,
  AuthUseCase,
} from '../../../application/port/in/auth.use-case';
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../../../domain/user';
import { Request } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authUseCaseMock: jest.Mocked<AuthUseCase>;

  beforeEach(async () => {
    const authUseCaseMockFactory: () => MockType<AuthUseCase> = jest.fn(() => ({
      login: jest.fn(),
      refreshToken: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      getUserById: jest.fn(),
    }));

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AUTH_USE_CASE, useFactory: authUseCaseMockFactory },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authUseCaseMock = module.get(AUTH_USE_CASE);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should register a new user and return tokens', async () => {
      const user = new User(
        '1',
        registerDto.email,
        'hashedPassword',
        new Date(),
        new Date(),
      );
      const tokens = {
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      };
      authUseCaseMock.register.mockResolvedValue({ user, ...tokens });

      const result = await controller.register(registerDto);

      expect(authUseCaseMock.register).toHaveBeenCalledWith(
        expect.objectContaining(registerDto),
      );
      expect(result).toEqual({
        id: user.id,
        email: user.email,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      authUseCaseMock.register.mockRejectedValue(
        new ConflictException('Email already exists'),
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'password123' };

    it('should return tokens and user info for valid credentials', async () => {
      const user = new User(
        '1',
        loginDto.email,
        'hashedPassword',
        new Date(),
        new Date(),
      );
      const tokens = {
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      };
      authUseCaseMock.login.mockResolvedValue({ ...tokens, user });

      const result = await controller.login(loginDto);

      expect(authUseCaseMock.login).toHaveBeenCalledWith(
        expect.objectContaining(loginDto),
      );
      expect(result).toEqual({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: { id: user.id, email: user.email },
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      authUseCaseMock.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    const refreshTokenDto = { refreshToken: 'validRefreshToken' };

    it('should refresh tokens successfully', async () => {
      const newTokens = {
        accessToken: 'newAccessToken',
        refreshToken: 'newRefreshToken',
      };
      authUseCaseMock.refreshToken.mockResolvedValue(newTokens);

      const result = await controller.refreshToken(refreshTokenDto);

      expect(authUseCaseMock.refreshToken).toHaveBeenCalledWith(
        expect.objectContaining(refreshTokenDto),
      );
      expect(result).toEqual(newTokens);
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      authUseCaseMock.refreshToken.mockRejectedValue(
        new UnauthorizedException('Invalid refresh token'),
      );

      await expect(controller.refreshToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const mockRequest = { user: { id: '1' } } as unknown as Request;

      await controller.logout(mockRequest);

      expect(authUseCaseMock.logout).toHaveBeenCalledWith('1');
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', async () => {
      const mockRequest = { user: { id: '1' } } as unknown as Request;
      const user = new User(
        '1',
        'test@example.com',
        'hashedPassword',
        new Date(),
        new Date(),
      );

      authUseCaseMock.getUserById.mockResolvedValue(user);

      const result = await controller.getCurrentUser(mockRequest);

      expect(authUseCaseMock.getUserById).toHaveBeenCalledWith('1');
      expect(result).toEqual({ id: user.id, email: user.email });
    });

    it('should throw NotFoundException if user not found', async () => {
      const mockRequest = { user: { id: '1' } } as unknown as Request;

      authUseCaseMock.getUserById.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.getCurrentUser(mockRequest)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

type MockType<T> = {
  [P in keyof T]: jest.Mock<any>;
};
