import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';

import { RefreshToken } from '@auth/domain/refresh-token';
import * as bcrypt from 'bcrypt';
import { User } from '@auth/domain/user';
import {
  USER_REPOSITORY_PORT,
  UserRepositoryPort,
} from '@auth/application/port/out/user-repository.port';
import { AuthService } from '@auth/application/service/auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let userRepositoryMock: jest.Mocked<UserRepositoryPort>;
  let jwtServiceMock: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const userRepositoryMockFactory: () => MockType<UserRepositoryPort> =
      jest.fn(() => ({
        findByEmail: jest.fn(),
        findById: jest.fn(),
        save: jest.fn(),
        saveRefreshToken: jest.fn(),
        findRefreshToken: jest.fn(),
        deleteRefreshToken: jest.fn(),
      }));

    const jwtServiceMockFactory: () => MockType<JwtService> = jest.fn(() => ({
      sign: jest.fn(),
      signAsync: jest.fn(),
      verify: jest.fn(),
      verifyAsync: jest.fn(),
      decode: jest.fn(),
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: USER_REPOSITORY_PORT,
          useFactory: userRepositoryMockFactory,
        },
        { provide: JwtService, useFactory: jwtServiceMockFactory },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepositoryMock = module.get(USER_REPOSITORY_PORT);
    jwtServiceMock = module.get(JwtService);
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
        new Date(),
        new Date(),
      );
      const tokens = {
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      };

      userRepositoryMock.findByEmail.mockResolvedValue(null);
      userRepositoryMock.save.mockResolvedValue(savedUser);
      jwtServiceMock.sign
        .mockReturnValueOnce(tokens.accessToken)
        .mockReturnValueOnce(tokens.refreshToken);

      const result = await service.register(registerCommand);

      expect(result).toEqual({ user: savedUser, ...tokens });
      expect(userRepositoryMock.findByEmail).toHaveBeenCalledWith(
        registerCommand.email,
      );
      expect(userRepositoryMock.save).toHaveBeenCalled();
      expect(jwtServiceMock.sign).toHaveBeenCalledTimes(2);
      expect(userRepositoryMock.saveRefreshToken).toHaveBeenCalled();
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
        new Date(),
        new Date(),
      );

      userRepositoryMock.findByEmail.mockResolvedValue(existingUser);

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
        new Date(),
        new Date(),
      );
      const tokens = {
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      };

      userRepositoryMock.findByEmail.mockResolvedValue(user);
      jwtServiceMock.sign
        .mockReturnValueOnce(tokens.accessToken)
        .mockReturnValueOnce(tokens.refreshToken);
      userRepositoryMock.saveRefreshToken.mockResolvedValue({} as RefreshToken);

      const result = await service.login(loginCommand);

      expect(result).toEqual({ ...tokens, user });
      expect(userRepositoryMock.findByEmail).toHaveBeenCalledWith(
        loginCommand.email,
      );
      expect(jwtServiceMock.sign).toHaveBeenCalledTimes(2);
      expect(userRepositoryMock.saveRefreshToken).toHaveBeenCalled();
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
        new Date(),
        new Date(),
      );

      userRepositoryMock.findByEmail.mockResolvedValue(user);

      await expect(service.login(loginCommand)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      const loginCommand = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      userRepositoryMock.findByEmail.mockResolvedValue(null);

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
        new Date(),
        new Date(),
      );
      const storedRefreshToken = new RefreshToken(
        '1',
        refreshTokenCommand.refreshToken,
        user.id,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        new Date(),
      );

      jwtServiceMock.verify.mockReturnValue({
        sub: user.id,
        email: user.email,
      });
      userRepositoryMock.findRefreshToken.mockResolvedValue(storedRefreshToken);
      userRepositoryMock.findById.mockResolvedValue(user);
      jwtServiceMock.sign
        .mockReturnValueOnce('newAccessToken')
        .mockReturnValueOnce('newRefreshToken');

      const result = await service.refreshToken(refreshTokenCommand);

      expect(result).toEqual({
        accessToken: 'newAccessToken',
        refreshToken: 'newRefreshToken',
      });
      expect(userRepositoryMock.deleteRefreshToken).toHaveBeenCalledWith(
        user.id,
      );
      expect(userRepositoryMock.saveRefreshToken).toHaveBeenCalled();
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
        new Date(),
        new Date(),
      );
      const expiredRefreshToken = new RefreshToken(
        '1',
        refreshTokenCommand.refreshToken,
        user.id,
        new Date(Date.now() - 1000), // Expired
        new Date(),
      );

      jwtServiceMock.verify.mockReturnValue({
        sub: user.id,
        email: user.email,
      });
      userRepositoryMock.findRefreshToken.mockResolvedValue(
        expiredRefreshToken,
      );

      await expect(service.refreshToken(refreshTokenCommand)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const userId = '1';

      await service.logout(userId);

      expect(userRepositoryMock.deleteRefreshToken).toHaveBeenCalledWith(
        userId,
      );
    });
  });

  describe('getUserById', () => {
    it('should return user for valid id', async () => {
      const userId = '1';
      const user = new User(
        userId,
        'test@example.com',
        'hashedPassword',
        new Date(),
        new Date(),
      );

      userRepositoryMock.findById.mockResolvedValue(user);

      const result = await service.getUserById(userId);

      expect(result).toEqual(user);
      expect(userRepositoryMock.findById).toHaveBeenCalledWith(userId);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      const userId = 'nonexistent';

      userRepositoryMock.findById.mockResolvedValue(null);

      await expect(service.getUserById(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

type MockType<T> = {
  [P in keyof T]: jest.Mock<any>;
};
