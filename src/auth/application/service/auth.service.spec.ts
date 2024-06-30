import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserRepositoryPort } from '../port/out/user-repository.port';
import { User } from '../../domain/user';
import { RefreshToken } from '../../domain/refresh-token';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let userRepositoryMock: jest.Mocked<UserRepositoryPort>;
  let jwtServiceMock: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const userRepositoryMockFactory: () => MockType<UserRepositoryPort> =
      jest.fn(() => ({
        findByEmail: jest.fn(),
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
          provide: 'UserRepositoryPort',
          useFactory: userRepositoryMockFactory,
        },
        { provide: JwtService, useFactory: jwtServiceMockFactory },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepositoryMock = module.get('UserRepositoryPort');
    jwtServiceMock = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerCommand = {
        email: 'test@example.com',
        password: 'password123',
      };
      const savedUser = new User(
        1,
        registerCommand.email,
        'hashedPassword',
        new Date(),
        new Date(),
      );

      userRepositoryMock.findByEmail.mockResolvedValue(null);
      userRepositoryMock.save.mockResolvedValue(savedUser);

      const result = await service.register(registerCommand);

      expect(result).toEqual(savedUser);
      expect(userRepositoryMock.findByEmail).toHaveBeenCalledWith(
        registerCommand.email,
      );
      expect(userRepositoryMock.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      const registerCommand = {
        email: 'test@example.com',
        password: 'password123',
      };
      const existingUser = new User(
        1,
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
    it('should return tokens for valid credentials', async () => {
      const loginCommand = {
        email: 'test@example.com',
        password: 'password123',
      };
      const user = new User(
        1,
        loginCommand.email,
        await bcrypt.hash(loginCommand.password, 10),
        new Date(),
        new Date(),
      );
      const tokens = {
        accessToken: 'token',
        refreshToken: 'token',
      };

      userRepositoryMock.findByEmail.mockResolvedValue(user);
      jwtServiceMock.sign.mockReturnValue('token');
      userRepositoryMock.saveRefreshToken.mockResolvedValue({} as RefreshToken);

      const result = await service.login(loginCommand);

      expect(result).toEqual(tokens);
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
        1,
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
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      const refreshTokenCommand = { refreshToken: 'validRefreshToken' };
      const user = new User(
        1,
        'test@example.com',
        'hashedPassword',
        new Date(),
        new Date(),
      );
      const storedRefreshToken = new RefreshToken(
        1,
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
      jwtServiceMock.sign.mockReturnValue('newToken');

      const result = await service.refreshToken(refreshTokenCommand);

      expect(result).toEqual({
        accessToken: 'newToken',
        refreshToken: 'newToken',
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
  });
});

type MockType<T> = {
  [P in keyof T]: jest.Mock<any>;
};
