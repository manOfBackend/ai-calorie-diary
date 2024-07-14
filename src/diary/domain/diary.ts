export class Diary {
  constructor(
    public id: string,
    public content: string,
    public imageUrl: string | null,
    public userId: string,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}
}
