export interface Recipe {
  id: string;
  type?: 'recipe';
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
  category?: string;
}

export interface Note {
  id: string;
  type: 'note';
  text: string;
  details?: string;
}

export type MealItem = Recipe | Note;

export interface UserPreferences {
  ingredients: string[];
  restrictions: string[];
  cuisine: string;
}
