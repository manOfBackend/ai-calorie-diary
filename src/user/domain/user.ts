export class User {
  constructor(
    public id: string | null,
    public email: string,
    public password: string | null,
    public firstName: string | null,
    public lastName: string | null,
    public provider: string | null,
    public providerId: string | null,
    public profilePicture: string | null,
    public targetCalories: number | null,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}

  static create(
    email: string,
    password: string | null,
    firstName: string | null = null,
    lastName: string | null = null,
    provider: string | null = null,
    providerId: string | null = null,
    profilePicture: string | null = null,
    targetCalories: number | null = null,
  ): User {
    return new User(
      null,
      email,
      password,
      firstName,
      lastName,
      provider,
      providerId,
      profilePicture,
      targetCalories,
      new Date(),
      new Date(),
    );
  }
}
