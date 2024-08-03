// src/user/application/port/in/user.use-case.ts

import { User } from '@user/domain/user';

export interface UserUseCase {
  getUserInfo(userId: string): Promise<User>;
  updateTargetCalories(userId: string, targetCalories: number): Promise<User>;
}

export const USER_USE_CASE = Symbol('USER_USE_CASE');
