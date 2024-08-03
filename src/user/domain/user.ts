export class User {
  constructor(
    public id: string,
    public email: string,
    public password: string,
    public targetCalories: number | null,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}
