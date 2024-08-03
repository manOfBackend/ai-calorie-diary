type Ingredient = {
  protein: { amount: number; unit: string; calories: number };
  fat: { amount: number; unit: string; calories: number };
  carbohydrate: { amount: number; unit: string; calories: number };
};

export type FoodBreakdown = { [ingredient: string]: Ingredient };
