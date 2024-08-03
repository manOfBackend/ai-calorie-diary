import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

import * as bcrypt from 'bcrypt';
import { User } from '@user/domain/user';
import { AuthService } from '@auth/application/service/auth.service';
import {
  USER_USE_CASE,
  UserUseCase,
} from '@user/application/port/in/user.use-case';

describe('AuthService', () => {
  let service: AuthService;
  let userUseCaseMock: jest.Mocked<UserUseCase>;
  let jwtServiceMock: jest.Mocked<JwtService>;

  beforeEach(async () => {
    userUseCaseMock = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      saveRefreshToken: jest.fn(),
      findRefreshToken: jest.fn(),
      deleteRefreshToken: jest.fn(),
      updateTargetCalories: jest.fn(),
      getUserInfo: jest.fn(),
    };

    jwtServiceMock = {
      sign: jest.fn(),
      signAsync: jest.fn(),
      verify: jest.fn(),
      verifyAsync: jest.fn(),
      decode: jest.fn(),
      getSecretKey: jest.fn(),
      logger: jest.fn(),
      mergeJwtOptions: jest.fn(),
      options: jest.fn(),
      overrideSecretFromOptions: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: USER_USE_CASE, useValue: userUseCaseMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user and return tokens', async () => {
      const registerCommand = {
        email: 'test@example.com',
        password: 'password123',
      };
      const savedUser = new User(
        '1',
        registerCommand.email,
        'hashedPassword',
        2000,
        new Date(),
        new Date(),
      );
      const tokens = {
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      };

      userUseCaseMock.findByEmail.mockResolvedValue(null);
      userUseCaseMock.create.mockResolvedValue(savedUser);
      jwtServiceMock.sign
        .mockReturnValueOnce(tokens.accessToken)
        .mockReturnValueOnce(tokens.refreshToken);

      const result = await service.register(registerCommand);

      expect(result).toEqual(
        expect.objectContaining({
          user: expect.objectContaining({
            id: savedUser.id,
            email: savedUser.email,
          }),
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        }),
      );
      expect(userUseCaseMock.findByEmail).toHaveBeenCalledWith(
        registerCommand.email,
      );
      expect(userUseCaseMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: registerCommand.email,
          password: expect.any(String),
        }),
      );
      expect(jwtServiceMock.sign).toHaveBeenCalledTimes(2);
      expect(userUseCaseMock.saveRefreshToken).toHaveBeenCalledWith(
        savedUser.id,
        tokens.refreshToken,
        expect.any(Date),
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      const registerCommand = {
        email: 'test@example.com',
        password: 'password123',
      };
      const existingUser = new User(
        '1',
        registerCommand.email,
        'hashedPassword',
        2000,
        new Date(),
        new Date(),
      );

      userUseCaseMock.findByEmail.mockResolvedValue(existingUser);

      await expect(service.register(registerCommand)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('should return tokens and user for valid credentials', async () => {
      const loginCommand = {
        email: 'test@example.com',
        password: 'password123',
      };
      const user = new User(
        '1',
        loginCommand.email,
        await bcrypt.hash(loginCommand.password, 10),
        2000,
        new Date(),
        new Date(),
      );
      const tokens = {
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      };

      userUseCaseMock.findByEmail.mockResolvedValue(user);
      jwtServiceMock.sign
        .mockReturnValueOnce(tokens.accessToken)
        .mockReturnValueOnce(tokens.refreshToken);

      const result = await service.login(loginCommand);

      expect(result).toEqual(
        expect.objectContaining({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: expect.objectContaining({
            id: user.id,
            email: user.email,
          }),
        }),
      );
      expect(userUseCaseMock.findByEmail).toHaveBeenCalledWith(
        loginCommand.email,
      );
      expect(jwtServiceMock.sign).toHaveBeenCalledTimes(2);
      expect(userUseCaseMock.saveRefreshToken).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const loginCommand = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };
      const user = new User(
        '1',
        loginCommand.email,
        await bcrypt.hash('password123', 10),
        2000,
        new Date(),
        new Date(),
      );

      userUseCaseMock.findByEmail.mockResolvedValue(user);

      await expect(service.login(loginCommand)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      const loginCommand = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      userUseCaseMock.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginCommand)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      const refreshTokenCommand = { refreshToken: 'validRefreshToken' };
      const user = new User(
        '1',
        'test@example.com',
        'hashedPassword',
        2000,
        new Date(),
        new Date(),
      );
      const storedRefreshToken = {
        token: refreshTokenCommand.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      jwtServiceMock.verify.mockReturnValue({
        sub: user.id,
        email: user.email,
      });
      userUseCaseMock.findRefreshToken.mockResolvedValue(storedRefreshToken);
      userUseCaseMock.findById.mockResolvedValue(user);
      jwtServiceMock.sign
        .mockReturnValueOnce('newAccessToken')
        .mockReturnValueOnce('newRefreshToken');

      const result = await service.refreshToken(refreshTokenCommand);

      expect(result).toEqual({
        accessToken: 'newAccessToken',
        refreshToken: 'newRefreshToken',
      });
      expect(userUseCaseMock.deleteRefreshToken).toHaveBeenCalledWith(user.id);
      expect(userUseCaseMock.saveRefreshToken).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      const refreshTokenCommand = { refreshToken: 'invalidRefreshToken' };

      jwtServiceMock.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken(refreshTokenCommand)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for expired refresh token', async () => {
      const refreshTokenCommand = { refreshToken: 'expiredRefreshToken' };
      const user = new User(
        '1',
        'test@example.com',
        'hashedPassword',
        2000,
        new Date(),
        new Date(),
      );
      const expiredRefreshToken = {
        token: refreshTokenCommand.refreshToken,
        expiresAt: new Date(Date.now() - 1000), // Expired
      };

      jwtServiceMock.verify.mockReturnValue({
        sub: user.id,
        email: user.email,
      });
      userUseCaseMock.findRefreshToken.mockResolvedValue(expiredRefreshToken);

      await expect(service.refreshToken(refreshTokenCommand)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const userId = '1';

      await service.logout(userId);

      expect(userUseCaseMock.deleteRefreshToken).toHaveBeenCalledWith(userId);
    });
  });
});
