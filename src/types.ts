export interface Recipe {
  id: string;
  title: string;
  description: string;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  cuisine: string;
  costPerPortion: "$" | "$$" | "$$$";
  caloriesPerPortion: number;
  proteinPerPortion: string;
  servings: number;
  ingredients: {
    name: string;
    amount: string;
    isMissing: boolean;
  }[];
  instructions: string[];
  dietaryTags: string[];
}

export interface UserPreferences {
  ingredients: string[];
  restrictions: string[];
  cuisine: string;
}
