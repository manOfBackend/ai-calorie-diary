type Ingredient = {
  protein: { amount: number; unit: string; calories: number };
  fat: { amount: number; unit: string; calories: number };
  carbohydrate: { amount: number; unit: string; calories: number };
};

export class FoodAnalysis {
  constructor(
    public ingredients: string[],
    public totalCalories: number,
    public breakdown: { [ingredient: string]: Ingredient },
  ) {}
}
