export class RefreshToken {
  constructor(
    public readonly id: string,
    public readonly token: string,
    public readonly userId: string,
    public readonly expiresAt: Date,
    public readonly createdAt: Date,
  ) {}
}
