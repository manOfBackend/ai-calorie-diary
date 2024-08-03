import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';
import { User } from '@user/domain/user';
import { AuthService } from '@auth/application/service/auth.service';
import { UserService } from '@user/application/service/user.service';

describe('AuthService', () => {
  let service: AuthService;
  let userServiceMock: jest.Mocked<UserService>;
  let jwtServiceMock: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const userServiceMockFactory: () => MockType<UserService> = jest.fn(() => ({
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      saveRefreshToken: jest.fn(),
      findRefreshToken: jest.fn(),
      deleteRefreshToken: jest.fn(),
      updateTargetCalories: jest.fn(),
      getUserInfo: jest.fn(),
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
        { provide: UserService, useFactory: userServiceMockFactory },
        { provide: JwtService, useFactory: jwtServiceMockFactory },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userServiceMock = module.get(UserService);
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
        2000,
        new Date(),
        new Date(),
      );
      const tokens = {
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      };

      userServiceMock.findByEmail.mockResolvedValue(null);
      userServiceMock.create.mockResolvedValue(savedUser);
      jwtServiceMock.sign
        .mockReturnValueOnce(tokens.accessToken)
        .mockReturnValueOnce(tokens.refreshToken);

      const result = await service.register(registerCommand);

      expect(result).toEqual({ user: savedUser, ...tokens });
      expect(userServiceMock.findByEmail).toHaveBeenCalledWith(
        registerCommand.email,
      );
      expect(userServiceMock.create).toHaveBeenCalled();
      expect(jwtServiceMock.sign).toHaveBeenCalledTimes(2);
      expect(userServiceMock.saveRefreshToken).toHaveBeenCalled();
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

      userServiceMock.findByEmail.mockResolvedValue(existingUser);

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

      userServiceMock.findByEmail.mockResolvedValue(user);
      jwtServiceMock.sign
        .mockReturnValueOnce(tokens.accessToken)
        .mockReturnValueOnce(tokens.refreshToken);

      const result = await service.login(loginCommand);

      expect(result).toEqual({ ...tokens, user });
      expect(userServiceMock.findByEmail).toHaveBeenCalledWith(
        loginCommand.email,
      );
      expect(jwtServiceMock.sign).toHaveBeenCalledTimes(2);
      expect(userServiceMock.saveRefreshToken).toHaveBeenCalled();
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

      userServiceMock.findByEmail.mockResolvedValue(user);

      await expect(service.login(loginCommand)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      const loginCommand = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      userServiceMock.findByEmail.mockResolvedValue(null);

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
      userServiceMock.findRefreshToken.mockResolvedValue(storedRefreshToken);
      userServiceMock.findById.mockResolvedValue(user);
      jwtServiceMock.sign
        .mockReturnValueOnce('newAccessToken')
        .mockReturnValueOnce('newRefreshToken');

      const result = await service.refreshToken(refreshTokenCommand);

      expect(result).toEqual({
        accessToken: 'newAccessToken',
        refreshToken: 'newRefreshToken',
      });
      expect(userServiceMock.deleteRefreshToken).toHaveBeenCalledWith(user.id);
      expect(userServiceMock.saveRefreshToken).toHaveBeenCalled();
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
      userServiceMock.findRefreshToken.mockResolvedValue(expiredRefreshToken);

      await expect(service.refreshToken(refreshTokenCommand)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const userId = '1';

      await service.logout(userId);

      expect(userServiceMock.deleteRefreshToken).toHaveBeenCalledWith(userId);
    });
  });

  describe('getUserById', () => {
    it('should return user for valid id', async () => {
      const userId = '1';
      const user = new User(
        userId,
        'test@example.com',
        'hashedPassword',
        2000,
        new Date(),
        new Date(),
      );

      userServiceMock.findById.mockResolvedValue(user);

      const result = await service.getUserById(userId);

      expect(result).toEqual(user);
      expect(userServiceMock.findById).toHaveBeenCalledWith(userId);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      const userId = 'nonexistent';

      userServiceMock.findById.mockResolvedValue(null);

      await expect(service.getUserById(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

type MockType<T> = {
  [P in keyof T]: jest.Mock<any>;
};
