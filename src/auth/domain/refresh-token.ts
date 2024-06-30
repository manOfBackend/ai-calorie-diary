export class RefreshToken {
  constructor(
    public readonly id: number,
    public readonly token: string,
    public readonly userId: number,
    public readonly expiresAt: Date,
    public readonly createdAt: Date,
  ) {}
}
