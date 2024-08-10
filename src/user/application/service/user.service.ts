import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserUseCase } from '../port/in/user.use-case';
import {
  USER_REPOSITORY_PORT,
  UserRepositoryPort,
} from '../port/out/user-repository.port';
import { User } from '../../domain/user';

@Injectable()
export class UserService implements UserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async create(user: User): Promise<User> {
    return this.userRepository.create(user);
  }

  async update(user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  async saveRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.userRepository.saveRefreshToken(userId, token, expiresAt);
  }

  async findRefreshToken(
    userId: string,
  ): Promise<{ token: string; expiresAt: Date } | null> {
    return this.userRepository.findRefreshToken(userId);
  }

  async deleteRefreshToken(userId: string): Promise<void> {
    await this.userRepository.deleteRefreshToken(userId);
  }

  async getUserInfo(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateTargetCalories(
    userId: string,
    targetCalories: number,
  ): Promise<User> {
    if (targetCalories < 500) {
      throw new BadRequestException('Target calories must be greater than 500');
    }
    const updatedUser = await this.userRepository.updateTargetCalories(
      userId,
      targetCalories,
    );
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
    return updatedUser;
  }
}
