export class FoodAnalysis {
  constructor(
    public ingredients: string[],
    public totalCalories: number,
    public breakdown: { [ingredient: string]: number },
  ) {}
}
