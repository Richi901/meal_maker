import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { 
  Plus, 
  Minus,
  X, 
  ChefHat, 
  Clock, 
  DollarSign, 
  Flame, 
  Copy, 
  Check, 
  RefreshCw,
  Utensils,
  AlertCircle,
  Search,
  ShoppingCart,
  Trash2,
  ChevronRight,
  ArrowUp,
  Calendar,
  Box,
  Users,
  Dumbbell,
  GripVertical,
  Menu,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from './lib/utils';
import { Recipe, Note, MealItem } from './types';
import { translations, Language } from './translations';

const CUISINES = [
  "General",
  "Italian",
  "Mexican",
  "Asian",
  "Mediterranean",
  "French",
  "Indian",
  "American",
  "Japanese"
] as const;

const DIETARY_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Dairy-Free",
  "Keto",
  "Paleo",
  "Nut-Free",
  "High-Protein",
  "Low-Calorie"
] as const;

const MEAL_TYPES = [
  "Any",
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack",
  "Dessert"
] as const;

const PANTRY_STAPLES = [
  "Salt", "Black Pepper", "Olive Oil", "Vegetable Oil", "Garlic Powder",
  "Onion Powder", "Dried Oregano", "Dried Basil", "Flour", "Sugar",
  "Rice", "Pasta", "Soy Sauce", "Vinegar", "Honey", "Canned Tomatoes", "Beans"
];

const REFRIGERATOR_STAPLES = [
  "Milk", "Eggs", "Butter", "Cheese", "Yogurt", "Carrots", "Onions", "Garlic", "Ginger", "Lemons", "Limes", "Mayonnaise", "Mustard", "Ketchup"
];

const FREEZER_STAPLES = [
  "Frozen Peas", "Frozen Corn", "Frozen Berries", "Chicken Breast", "Ground Beef", "Fish Fillets", "Frozen Spinach", "Ice Cream"
];

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

function DraggableMealItem({ item, day, onRecipeClick, onRemove, isFavorite, onToggleFavorite }: { 
  item: MealItem, 
  day: string, 
  onRecipeClick: (r: Recipe) => void, 
  onRemove: (id: string, day: string) => void,
  isFavorite?: (id: string) => boolean,
  onToggleFavorite?: (r: Recipe) => void
}) {
  const isNote = 'type' in item && item.type === 'note';
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={cn(
        "p-3 rounded-2xl relative group cursor-pointer transition-colors",
        isNote ? "bg-orange-50 border border-orange-100 hover:bg-orange-100" : "bg-[#F5F5F0] hover:bg-[#E6E0D4]"
      )}
      onClick={() => !isNote && onRecipeClick(item as Recipe)}
    >
      <div {...attributes} {...listeners} className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center text-[#8E8E8E] opacity-100 lg:opacity-0 lg:group-hover:opacity-100 cursor-grab active:cursor-grabbing z-10">
        <GripVertical size={16} />
      </div>
      <div className="pl-8">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-xs font-bold leading-tight pr-4">{isNote ? (item as Note).text : (item as Recipe).title}</h4>
          {!isNote && isFavorite && onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(item as Recipe);
              }}
              className={cn(
                "shrink-0 transition-colors",
                isFavorite(item.id) ? "text-red-500" : "text-[#8E8E8E] hover:text-red-500"
              )}
            >
              <Heart size={12} className={cn(isFavorite(item.id) && "fill-current")} />
            </button>
          )}
        </div>
        {!isNote && (
          <div className="flex items-center gap-2 mt-2 opacity-60">
            <Clock size={10} />
            <span className="text-[10px]">{(item as Recipe).totalTime}</span>
          </div>
        )}
        {isNote && (
          <div className="flex items-center gap-2 mt-2 opacity-60">
            <Box size={10} />
            <span className="text-[10px] uppercase tracking-wider font-bold">Note</span>
          </div>
        )}
      </div>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onRemove(item.id, day);
        }}
        className="absolute bottom-2 right-2 text-[#8E8E8E] hover:text-red-500 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

function DroppableDay({ day, items, onRecipeClick, onRemove, isFavorite, onToggleFavorite }: { 
  day: string, 
  items: MealItem[], 
  onRecipeClick: (r: Recipe) => void,
  onRemove: (id: string, day: string) => void,
  isFavorite: (id: string) => boolean,
  onToggleFavorite: (r: Recipe) => void
}) {
  const { setNodeRef, isOver } = useSortable({ id: day });

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xs font-bold uppercase tracking-widest text-[#8E8E8E] text-center">{day}</h3>
      <div 
        ref={setNodeRef}
        className={cn(
          "flex-1 min-h-[200px] bg-white border rounded-3xl p-3 space-y-3 transition-colors",
          isOver ? "bg-[#F5F5F0] border-[#5A5A40]" : "border-[#E6E0D4]"
        )}
      >
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {items.length > 0 ? (
            items.map(item => (
              <DraggableMealItem 
                key={item.id} 
                item={item} 
                day={day} 
                onRecipeClick={onRecipeClick} 
                onRemove={onRemove} 
                isFavorite={isFavorite}
                onToggleFavorite={onToggleFavorite}
              />
            ))
          ) : (
            <div className="h-full flex items-center justify-center border-2 border-dashed border-[#F5F5F0] rounded-2xl">
              <span className="text-[10px] text-[#8E8E8E] italic">No meals</span>
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}

type InventoryCategory = 'pantry' | 'refrigerator' | 'freezer';

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('mealmaker_lang');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const t = (key: string) => {
    const keys = key.split('.');
    let result: any = translations[lang];
    for (const k of keys) {
      if (result[k] === undefined) return key;
      result = result[k];
    }
    return result;
  };

  const [ingredients, setIngredients] = useState<string[]>(() => {
    const saved = localStorage.getItem('mealmaker_ingredients');
    return saved ? JSON.parse(saved) : [];
  });
  const [inputIngredient, setInputIngredient] = useState('');
  const [restrictions, setRestrictions] = useState<string[]>(() => {
    const saved = localStorage.getItem('mealmaker_restrictions');
    return saved ? JSON.parse(saved) : [];
  });
  const [inputRestriction, setInputRestriction] = useState('');
  const [cuisine, setCuisine] = useState('General');
  const [mealType, setMealType] = useState('Any');
  const [servings, setServings] = useState(2);
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem('mealmaker_recipes');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('mealmaker_selected_ids');
    return saved ? JSON.parse(saved) : [];
  });
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [activeTab, setActiveTab] = useState<'recipes' | 'pantry' | 'planner'>('recipes');
  const [inventory, setInventory] = useState<{ [key in InventoryCategory]: string[] }>(() => {
    const saved = localStorage.getItem('mealmaker_inventory');
    if (saved) return JSON.parse(saved);
    
    // Migration from old pantryStaples
    const oldPantry = localStorage.getItem('mealmaker_pantry');
    return {
      pantry: oldPantry ? JSON.parse(oldPantry) : [],
      refrigerator: [],
      freezer: []
    };
  });
  const [customInventory, setCustomInventory] = useState<{ [key in InventoryCategory]: string[] }>(() => {
    const saved = localStorage.getItem('mealmaker_custom_inventory');
    if (saved) return JSON.parse(saved);
    
    // Initial migration: any item in inventory that isn't a staple should be a custom item
    const initialCustom: { [key in InventoryCategory]: string[] } = {
      pantry: [],
      refrigerator: [],
      freezer: []
    };

    const categories: InventoryCategory[] = ['pantry', 'refrigerator', 'freezer'];
    const staplesMap = {
      pantry: PANTRY_STAPLES,
      refrigerator: REFRIGERATOR_STAPLES,
      freezer: FREEZER_STAPLES
    };

    // We need the initial inventory value for migration
    const savedInv = localStorage.getItem('mealmaker_inventory');
    const initialInv = savedInv ? JSON.parse(savedInv) : { pantry: [], refrigerator: [], freezer: [] };

    categories.forEach(cat => {
      initialCustom[cat] = initialInv[cat].filter((item: string) => !staplesMap[cat].includes(item));
    });

    return initialCustom;
  });
  const [activeInventoryTab, setActiveInventoryTab] = useState<InventoryCategory>('pantry');
  const [inputPantryStaple, setInputPantryStaple] = useState('');
  const [inputNote, setInputNote] = useState('');
  const [mealPlan, setMealPlan] = useState<{ [key: string]: MealItem[] }>(() => {
    const saved = localStorage.getItem('mealmaker_mealplan');
    return saved ? JSON.parse(saved) : {};
  });
  const [viewingPlannerRecipe, setViewingPlannerRecipe] = useState<Recipe | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<MealItem | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [recipeSubTab, setRecipeSubTab] = useState<'search' | 'favorites'>('search');
  const [favorites, setFavorites] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem('mealmaker_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [openPlannerId, setOpenPlannerId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('mealmaker_ingredients', JSON.stringify(ingredients));
  }, [ingredients]);

  useEffect(() => {
    localStorage.setItem('mealmaker_restrictions', JSON.stringify(restrictions));
  }, [restrictions]);

  useEffect(() => {
    localStorage.setItem('mealmaker_recipes', JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem('mealmaker_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('mealmaker_custom_inventory', JSON.stringify(customInventory));
  }, [customInventory]);

  useEffect(() => {
    localStorage.setItem('mealmaker_mealplan', JSON.stringify(mealPlan));
  }, [mealPlan]);

  useEffect(() => {
    localStorage.setItem('mealmaker_selected_ids', JSON.stringify(selectedRecipeIds));
  }, [selectedRecipeIds]);

  useEffect(() => {
    localStorage.setItem('mealmaker_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('mealmaker_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    const handleClickOutside = () => setOpenPlannerId(null);
    if (openPlannerId) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [openPlannerId]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    // Find the item being dragged
    for (const day of DAYS_OF_WEEK) {
      const item = mealPlan[day]?.find(i => i.id === active.id);
      if (item) {
        setActiveItem(item);
        break;
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveItem(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find source and destination days
    let sourceDay: string | null = null;
    let destDay: string | null = null;

    // Check if overId is a day container or an item within a day
    if ((DAYS_OF_WEEK as readonly string[]).includes(overId)) {
      destDay = overId;
    } else {
      for (const day of DAYS_OF_WEEK) {
        if (mealPlan[day]?.some(i => i.id === overId)) {
          destDay = day;
          break;
        }
      }
    }

    for (const day of DAYS_OF_WEEK) {
      if (mealPlan[day]?.some(i => i.id === activeId)) {
        sourceDay = day;
        break;
      }
    }

    if (!sourceDay || !destDay) return;

    if (sourceDay === destDay) {
      // Reorder within the same day
      const oldIndex = mealPlan[sourceDay].findIndex(i => i.id === activeId);
      const newIndex = mealPlan[destDay].findIndex(i => i.id === overId);
      
      if (oldIndex !== newIndex && newIndex !== -1) {
        setMealPlan(prev => ({
          ...prev,
          [sourceDay!]: arrayMove(prev[sourceDay!], oldIndex, newIndex)
        }));
      }
    } else {
      // Move to a different day
      const itemToMove = mealPlan[sourceDay].find(i => i.id === activeId);
      if (itemToMove) {
        setMealPlan(prev => {
          const newSourceList = prev[sourceDay!].filter(i => i.id !== activeId);
          const newDestList = [...(prev[destDay!] || []), itemToMove];
          return {
            ...prev,
            [sourceDay!]: newSourceList,
            [destDay!]: newDestList
          };
        });
      }
    }
  };

  const togglePantryStaple = (staple: string) => {
    setInventory(prev => {
      const currentList = prev[activeInventoryTab];
      const newList = currentList.includes(staple) 
        ? currentList.filter(s => s !== staple) 
        : [...currentList, staple];
      return { ...prev, [activeInventoryTab]: newList };
    });
  };

  const addCustomPantryStaple = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = inputPantryStaple.trim();
    if (trimmed) {
      const isStaple = 
        (activeInventoryTab === 'pantry' && PANTRY_STAPLES.includes(trimmed)) ||
        (activeInventoryTab === 'refrigerator' && REFRIGERATOR_STAPLES.includes(trimmed)) ||
        (activeInventoryTab === 'freezer' && FREEZER_STAPLES.includes(trimmed));

      if (isStaple) {
        if (!inventory[activeInventoryTab].includes(trimmed)) {
          setInventory(prev => ({
            ...prev,
            [activeInventoryTab]: [...prev[activeInventoryTab], trimmed]
          }));
        }
      } else {
        if (!customInventory[activeInventoryTab].includes(trimmed)) {
          setCustomInventory(prev => ({
            ...prev,
            [activeInventoryTab]: [...prev[activeInventoryTab], trimmed]
          }));
        }
        if (!inventory[activeInventoryTab].includes(trimmed)) {
          setInventory(prev => ({
            ...prev,
            [activeInventoryTab]: [...prev[activeInventoryTab], trimmed]
          }));
        }
      }
      setInputPantryStaple('');
    }
  };

  const removeCustomInventoryItem = (item: string, category: InventoryCategory) => {
    setCustomInventory(prev => ({
      ...prev,
      [category]: prev[category].filter(i => i !== item)
    }));
    setInventory(prev => ({
      ...prev,
      [category]: prev[category].filter(i => i !== item)
    }));
  };

  const addToMealPlan = (recipe: Recipe, day: string) => {
    setMealPlan(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), recipe]
    }));
    setOpenPlannerId(null);
  };

  const addNoteToPlanner = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputNote.trim()) return;
    
    const newNote: Note = {
      id: `note-${Date.now()}`,
      type: 'note',
      text: inputNote.trim()
    };
    
    // Default to Monday or first day
    const day = DAYS_OF_WEEK[0];
    setMealPlan(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), newNote]
    }));
    setInputNote('');
  };

  const removeFromMealPlan = (recipeId: string, day: string) => {
    setMealPlan(prev => ({
      ...prev,
      [day]: (prev[day] || []).filter(r => r.id !== recipeId)
    }));
  };

  const toggleRecipeSelection = (id: string) => {
    setSelectedRecipeIds(prev => 
      prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]
    );
  };

  const toggleFavorite = (recipe: Recipe) => {
    setFavorites(prev => {
      const isFav = prev.some(r => r.id === recipe.id);
      if (isFav) {
        return prev.filter(r => r.id !== recipe.id);
      } else {
        return [...prev, recipe];
      }
    });
  };

  const isFavorite = (id: string) => favorites.some(r => r.id === id);

  const selectedRecipes = recipes.filter(r => selectedRecipeIds.includes(r.id));
  
  const aggregateMissingIngredients = () => {
    const missingMap = new Map<string, string>();
    selectedRecipes.forEach(recipe => {
      recipe.ingredients.filter(ing => ing.isMissing).forEach(ing => {
        // Simple aggregation: if same name, we just list them or combine if possible
        // For now, we'll just list them clearly
        const key = ing.name.toLowerCase();
        if (missingMap.has(key)) {
          missingMap.set(key, `${missingMap.get(key)}, ${ing.amount}`);
        } else {
          missingMap.set(key, ing.amount);
        }
      });
    });
    return Array.from(missingMap.entries()).map(([name, amount]) => ({ name, amount }));
  };

  const copyFullShoppingList = () => {
    const list = aggregateMissingIngredients()
      .map(item => `- ${item.amount} ${item.name}`)
      .join('\n');
    
    if (list) {
      navigator.clipboard.writeText(`${t('shoppingListFor')} ${selectedRecipes.length} ${t('recipesSelected')}:\n\n${list}`);
      setCopiedId('full-list');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const addIngredient = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputIngredient.trim() && !ingredients.includes(inputIngredient.trim())) {
      setIngredients([...ingredients, inputIngredient.trim()]);
      setInputIngredient('');
    }
  };

  const removeIngredient = (ing: string) => {
    setIngredients(ingredients.filter(i => i !== ing));
  };

  const clearIngredients = () => {
    setIngredients([]);
  };

  const toggleRestriction = (res: string) => {
    setRestrictions(prev => 
      prev.includes(res) ? prev.filter(r => r !== res) : [...prev, res]
    );
  };

  const addCustomRestriction = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = inputRestriction.trim();
    if (trimmed && !restrictions.includes(trimmed)) {
      setRestrictions([...restrictions, trimmed]);
      setInputRestriction('');
    }
  };

  const hasInventory = Object.values(inventory).some(items => items.length > 0);

  const generateRecipes = async (append = false) => {
    if (ingredients.length === 0 && !hasInventory) {
      setError(t('errorIngredients'));
      return;
    }

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setRecipes([]);
    }
    setError(null);
    
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey || apiKey === "") {
        setError(t('errorGeminiKey'));
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const model = "gemini-3.1-flash-lite-preview";

      const existingTitles = recipes.map(r => r.title).join(', ');
      const allInventory = [...inventory.pantry, ...inventory.refrigerator, ...inventory.freezer];
      const prompt = `Generate 2 creative and delicious recipes based on these parameters:
      LANGUAGE: ${lang === 'fr' ? 'French' : 'English'}
      SERVINGS: ${servings}
      PRIORITY Kitchen Ingredients (Use these first): ${ingredients.join(', ')}
      Secondary Inventory (Pantry/Fridge/Freezer): ${allInventory.join(', ')}
      Meal Type: ${mealType === 'Any' ? 'Any suitable meal' : mealType}
      Dietary Restrictions: ${restrictions.join(', ') || 'None'}
      Cuisine Preference: ${cuisine}
      ${append ? `Avoid generating these recipes which I already have: ${existingTitles}` : ''}

      For each recipe, identify which ingredients are "missing" (not in the priority or secondary lists).
      Ensure the cost per portion is an estimate: $ (budget), $$ (moderate), $$$ (premium).
      Ensure calories and protein are realistic estimates per serving.
      Specify the number of servings the recipe makes (it MUST be ${servings}).
      IMPORTANT: All text content (title, description, instructions, ingredients) MUST be in ${lang === 'fr' ? 'French' : 'English'}.`;

      // Retry logic for 503 errors (High Demand)
      let attempts = 0;
      const maxAttempts = 5; // Increased from 3 to 5
      let lastError: any = null;

      while (attempts < maxAttempts) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              systemInstruction: "You are a helpful culinary assistant. Provide concise, high-quality recipes in JSON format. Keep instructions clear but brief to minimize latency.",
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    prepTime: { type: Type.STRING },
                    cookTime: { type: Type.STRING },
                    totalTime: { type: Type.STRING },
                    cuisine: { type: Type.STRING },
                    costPerPortion: { type: Type.STRING, description: "$, $$, or $$$" },
                    caloriesPerPortion: { type: Type.INTEGER },
                    proteinPerPortion: { type: Type.STRING, description: "e.g. '25g'" },
                    servings: { type: Type.INTEGER },
                    ingredients: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          amount: { type: Type.STRING },
                          isMissing: { type: Type.BOOLEAN }
                        }
                      }
                    },
                    instructions: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    dietaryTags: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    }
                  },
                  required: ["id", "title", "description", "totalTime", "costPerPortion", "caloriesPerPortion", "proteinPerPortion", "servings", "ingredients", "instructions"]
                }
              }
            }
          });

          const data = JSON.parse(response.text || "[]");
          if (append) {
            setRecipes(prev => [...prev, ...data]);
          } else {
            setRecipes(data);
          }
          return; // Success, exit the function
        } catch (err: any) {
          lastError = err;
          const errorString = JSON.stringify(err).toLowerCase();
          const is503 = 
            err?.status === 503 || 
            err?.code === 503 || 
            err?.error?.code === 503 ||
            err?.message?.includes('503') || 
            err?.message?.includes('high demand') ||
            errorString.includes('503') ||
            errorString.includes('unavailable') ||
            errorString.includes('high_demand');
          
          if (is503 && attempts < maxAttempts - 1) {
            attempts++;
            // Exponential backoff with jitter: 2s, 4s, 8s, 16s
            const delay = (Math.pow(2, attempts) * 1000) + (Math.random() * 1000);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw err; 
        }
      }
    } catch (err: any) {
      console.error('Recipe Generation Error:', err);
      const errorString = JSON.stringify(err).toLowerCase();
      const is503 = 
        err?.status === 503 || 
        err?.code === 503 || 
        err?.error?.code === 503 ||
        err?.message?.includes('503') || 
        err?.message?.includes('high demand') ||
        errorString.includes('503') ||
        errorString.includes('unavailable') ||
        errorString.includes('high_demand');

      if (is503) {
        setError(t('error503'));
      } else {
        setError(t('errorGeneric'));
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const copyMissingIngredients = (recipe: Recipe) => {
    const missing = recipe.ingredients
      .filter(ing => ing.isMissing)
      .map(ing => `${ing.amount} ${ing.name}`)
      .join('\n');
    
    if (missing) {
      navigator.clipboard.writeText(missing);
      setCopiedId(recipe.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#2D2D2D] font-sans selection:bg-[#E6E0D4]">
      {/* Header */}
      <header className="border-b border-[#E6E0D4] bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-[#F5F5F0] p-1 rounded-xl mr-2">
              <button 
                onClick={() => setLang('en')}
                className={cn(
                  "px-2 py-1 text-[10px] font-bold rounded-lg transition-all",
                  lang === 'en' ? "bg-white text-[#5A5A40] shadow-sm" : "text-[#8E8E8E] hover:text-[#5A5A40]"
                )}
              >
                EN
              </button>
              <button 
                onClick={() => setLang('fr')}
                className={cn(
                  "px-2 py-1 text-[10px] font-bold rounded-lg transition-all",
                  lang === 'fr' ? "bg-white text-[#5A5A40] shadow-sm" : "text-[#8E8E8E] hover:text-[#5A5A40]"
                )}
              >
                FR
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#5A5A40] rounded-full flex items-center justify-center text-white">
                <ChefHat size={24} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-serif font-bold tracking-tight leading-none">{t('appName')}</h1>
                {t('appSubtitle') && (
                  <span className="text-[10px] text-[#8E8E8E] font-medium uppercase tracking-wider mt-0.5">{t('appSubtitle')}</span>
                )}
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-[#5A5A40]">
            <button 
              onClick={() => setActiveTab('recipes')}
              className={cn("hover:opacity-70 transition-opacity flex items-center gap-2", activeTab === 'recipes' && "text-[#5A5A40] font-bold underline underline-offset-8")}
            >
              {t('recipes')}
            </button>
            <button 
              onClick={() => setActiveTab('pantry')}
              className={cn("hover:opacity-70 transition-opacity flex items-center gap-2", activeTab === 'pantry' && "text-[#5A5A40] font-bold underline underline-offset-8")}
            >
              <Box size={18} />
              {t('kitchenInventory')}
            </button>
            <button 
              onClick={() => setActiveTab('planner')}
              className={cn("hover:opacity-70 transition-opacity flex items-center gap-2", activeTab === 'planner' && "text-[#5A5A40] font-bold underline underline-offset-8")}
            >
              <Calendar size={18} />
              {t('mealPlanner')}
            </button>
            <button 
              onClick={() => setShowShoppingList(true)}
              className="relative hover:opacity-70 transition-opacity flex items-center gap-2 ml-4"
            >
              <ShoppingCart size={18} />
              {t('shoppingList')}
              {selectedRecipeIds.length > 0 && (
                <span className="absolute -top-2 -right-4 bg-[#5A5A40] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {selectedRecipeIds.length}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Navigation Toggle */}
          <div className="flex sm:hidden items-center gap-2">
            <button 
              onClick={() => setShowShoppingList(true)}
              className="relative p-2 text-[#5A5A40] hover:bg-[#F5F5F0] rounded-full transition-colors"
            >
              <ShoppingCart size={20} />
              {selectedRecipeIds.length > 0 && (
                <span className="absolute top-1 right-1 bg-[#5A5A40] text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {selectedRecipeIds.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-[#5A5A40] hover:bg-[#F5F5F0] rounded-full transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="sm:hidden bg-white border-t border-[#E6E0D4] overflow-hidden"
            >
              <div className="px-4 py-6 flex flex-col gap-2">
                <button 
                  onClick={() => { setActiveTab('recipes'); setIsMobileMenuOpen(false); }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors",
                    activeTab === 'recipes' ? "bg-[#F5F5F0] text-[#5A5A40]" : "text-[#8E8E8E] hover:bg-[#FDFCFB]"
                  )}
                >
                  <Utensils size={20} />
                  {t('recipes')}
                </button>
                <button 
                  onClick={() => { setActiveTab('pantry'); setIsMobileMenuOpen(false); }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors",
                    activeTab === 'pantry' ? "bg-[#F5F5F0] text-[#5A5A40]" : "text-[#8E8E8E] hover:bg-[#FDFCFB]"
                  )}
                >
                  <Box size={20} />
                  {t('kitchenInventory')}
                </button>
                <button 
                  onClick={() => { setActiveTab('planner'); setIsMobileMenuOpen(false); }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors",
                    activeTab === 'planner' ? "bg-[#F5F5F0] text-[#5A5A40]" : "text-[#8E8E8E] hover:bg-[#FDFCFB]"
                  )}
                >
                  <Calendar size={20} />
                  {t('mealPlanner')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <AnimatePresence mode="wait">
          {activeTab === 'recipes' && (
            <motion.div 
              key="recipes-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-8"
            >
              {/* Sub-tabs for Recipes */}
              <div className="flex gap-8 border-b border-[#E6E0D4]">
                <button 
                  onClick={() => setRecipeSubTab('search')}
                  className={cn(
                    "pb-4 text-sm font-bold uppercase tracking-widest transition-all relative",
                    recipeSubTab === 'search' ? "text-[#5A5A40]" : "text-[#8E8E8E] hover:text-[#5A5A40]"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Search size={16} />
                    {t('search')}
                  </div>
                  {recipeSubTab === 'search' && (
                    <motion.div layoutId="recipeSubTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5A5A40]" />
                  )}
                </button>
                <button 
                  onClick={() => setRecipeSubTab('favorites')}
                  className={cn(
                    "pb-4 text-sm font-bold uppercase tracking-widest transition-all relative",
                    recipeSubTab === 'favorites' ? "text-[#5A5A40]" : "text-[#8E8E8E] hover:text-[#5A5A40]"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Heart size={16} className={cn(recipeSubTab === 'favorites' && "fill-current")} />
                    {t('favorites')}
                  </div>
                  {recipeSubTab === 'favorites' && (
                    <motion.div layoutId="recipeSubTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5A5A40]" />
                  )}
                </button>
              </div>

              {recipeSubTab === 'search' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  {/* Left Column: Inputs */}
                  <div className="lg:col-span-4 space-y-8">
                <section className="bg-white p-6 rounded-[32px] shadow-sm border border-[#E6E0D4]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-serif font-semibold flex items-center gap-2">
                      <Search size={18} className="text-[#5A5A40]" />
                      {t('refineSearch')}
                    </h2>
                    {ingredients.length > 0 && (
                      <button 
                        onClick={clearIngredients}
                        className="text-[10px] font-bold uppercase tracking-wider text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 size={12} />
                        {t('clearAll')}
                      </button>
                    )}
                  </div>
                  
                  <form onSubmit={addIngredient} className="relative mb-2">
                    <input 
                      type="text"
                      value={inputIngredient}
                      onChange={(e) => setInputIngredient(e.target.value)}
                      placeholder={t('searchPlaceholder')}
                      className="w-full pl-4 pr-12 py-3 bg-[#F5F5F0] rounded-2xl border-none focus:ring-2 focus:ring-[#5A5A40] transition-all text-sm"
                    />
                    <button 
                      type="submit"
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#5A5A40] text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                    >
                      <Plus size={18} />
                    </button>
                  </form>
                  <p className="text-[10px] text-[#8E8E8E] mb-4 ml-1">{t('refineSearchDesc')}</p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    <AnimatePresence>
                      {ingredients.map(ing => (
                        <motion.span 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          key={ing}
                          className="px-2.5 py-1 bg-[#E6E0D4] text-[#5A5A40] rounded-full text-[11px] font-medium flex items-center gap-1.5 group"
                        >
                          {ing}
                          <button onClick={() => removeIngredient(ing)} className="hover:text-red-500 transition-colors">
                            <X size={12} />
                          </button>
                        </motion.span>
                      ))}
                    </AnimatePresence>
                    {ingredients.length === 0 && (
                      <p className="text-xs text-[#8E8E8E] italic">{lang === 'fr' ? 'Aucun ingrédient ajouté.' : 'No ingredients added yet.'}</p>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[#8E8E8E] mb-3">{t('mealType')}</h3>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {MEAL_TYPES.map(type => (
                          <button
                            key={type}
                            onClick={() => setMealType(type)}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                              mealType === type 
                                ? "bg-[#5A5A40] text-white border-[#5A5A40]" 
                                : "bg-white text-[#5A5A40] border-[#E6E0D4] hover:border-[#5A5A40]"
                            )}
                          >
                            {t(`mealTypes.${type}`)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[#8E8E8E] mb-3">{t('servingsLabel')}</h3>
                      <div className="flex items-center gap-4 bg-[#F5F5F0] p-2 rounded-2xl border border-[#E6E0D4]">
                        <button 
                          onClick={() => setServings(Math.max(1, servings - 1))}
                          className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-[#5A5A40] shadow-sm hover:bg-[#E6E0D4] transition-colors"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="flex-1 text-center font-bold text-[#5A5A40]">{servings}</span>
                        <button 
                          onClick={() => setServings(Math.min(12, servings + 1))}
                          className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-[#5A5A40] shadow-sm hover:bg-[#E6E0D4] transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[#8E8E8E] mb-3">{t('dietaryOptionsTitle')}</h3>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {DIETARY_OPTIONS.map(opt => (
                          <button
                            key={opt}
                            onClick={() => toggleRestriction(opt)}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                              restrictions.includes(opt) 
                                ? "bg-[#5A5A40] text-white border-[#5A5A40]" 
                                : "bg-white text-[#5A5A40] border-[#E6E0D4] hover:border-[#5A5A40]"
                            )}
                          >
                            {t(`dietaryOptions.${opt}`)}
                          </button>
                        ))}
                      </div>

                      {/* Custom Restriction Input */}
                      <form onSubmit={addCustomRestriction} className="relative mb-4">
                        <input 
                          type="text"
                          value={inputRestriction}
                          onChange={(e) => setInputRestriction(e.target.value)}
                          placeholder={t('addRestriction')}
                          className="w-full pl-4 pr-12 py-2.5 bg-[#F5F5F0] rounded-xl border-none focus:ring-2 focus:ring-[#5A5A40] transition-all text-xs"
                        />
                        <button 
                          type="submit"
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-[#E6E0D4] text-[#5A5A40] rounded-lg flex items-center justify-center hover:bg-[#D6D0C4] transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </form>

                      {/* Display Custom Restrictions */}
                      <div className="flex flex-wrap gap-2">
                        {restrictions.filter(r => !(DIETARY_OPTIONS as readonly string[]).includes(r)).map(res => (
                          <span 
                            key={res}
                            className="px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-100 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                          >
                            {res}
                            <button onClick={() => toggleRestriction(res)} className="hover:text-orange-900">
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[#8E8E8E] mb-3">{t('cuisine')}</h3>
                      <select 
                        value={cuisine}
                        onChange={(e) => setCuisine(e.target.value)}
                        className="w-full px-4 py-3 bg-[#F5F5F0] rounded-2xl border-none focus:ring-2 focus:ring-[#5A5A40] text-sm appearance-none cursor-pointer"
                      >
                        {CUISINES.map(c => (
                          <option key={c} value={c}>{t(`cuisines.${c}`)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button 
                    onClick={() => generateRecipes(false)}
                    disabled={loading || (ingredients.length === 0 && !hasInventory)}
                    className="w-full mt-8 py-4 bg-[#5A5A40] text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-[#4A4A35] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#5A5A40]/20"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="animate-spin" size={20} />
                        {t('generating')}
                      </>
                    ) : (
                      <>
                        <ChefHat size={20} />
                        {t('generateRecipes')}
                      </>
                    )}
                  </button>

                  {error && (
                    <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-2xl text-xs flex flex-col gap-3 border border-red-100">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={14} className="shrink-0" />
                        <span className="font-medium">{error}</span>
                      </div>
                      <button 
                        onClick={() => generateRecipes(false)}
                        className="text-[10px] font-bold uppercase tracking-wider bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded-lg self-start hover:bg-red-50 transition-colors"
                      >
                        {lang === 'fr' ? 'Réessayer' : 'Try Again'}
                      </button>
                    </div>
                  )}
                </section>
              </div>

              {/* Right Column: Results */}
              <div className="lg:col-span-8">
                <AnimatePresence mode="wait">
                  {recipes.length > 0 ? (
                    <motion.div 
                      key="search-results"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-8"
                    >
                        <div className="flex items-center justify-between mb-2">
                          <h2 className="text-2xl font-serif font-bold">{lang === 'fr' ? 'Recommandé pour vous' : 'Recommended for You'}</h2>
                          <span className="text-sm text-[#8E8E8E]">{recipes.length} {lang === 'fr' ? 'recettes trouvées' : 'recipes found'}</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
                          {recipes.map((recipe, idx) => (
                            <motion.div 
                              key={recipe.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="bg-white rounded-[32px] overflow-hidden border border-[#E6E0D4] shadow-sm hover:shadow-md transition-shadow"
                            >
                              <div className="p-8">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                                  <div>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                      {recipe.dietaryTags.map(tag => (
                                        <span key={tag} className="px-2 py-1 bg-green-50 text-green-700 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                          {tag}
                                        </span>
                                      ))}
                                      <span className="px-2 py-1 bg-[#F5F5F0] text-[#5A5A40] rounded-md text-[10px] font-bold uppercase tracking-wider">
                                        {recipe.cuisine}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 mb-2">
                                      <h3 className="text-2xl font-serif font-bold">{recipe.title}</h3>
                                      <button 
                                        onClick={() => toggleFavorite(recipe)}
                                        className={cn(
                                          "p-2 rounded-full transition-all",
                                          isFavorite(recipe.id) ? "text-red-500 bg-red-50" : "text-[#8E8E8E] hover:bg-[#F5F5F0]"
                                        )}
                                        title={isFavorite(recipe.id) ? t('removeFromFavorites') : t('addToFavorites')}
                                      >
                                        <Heart size={20} className={cn(isFavorite(recipe.id) && "fill-current")} />
                                      </button>
                                    </div>
                                    <p className="text-[#5A5A40] text-sm leading-relaxed max-w-2xl">{recipe.description}</p>
                                    
                                    <div className="flex flex-wrap gap-3 mt-4">
                                      <button 
                                        onClick={() => toggleRecipeSelection(recipe.id)}
                                        className={cn(
                                          "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2",
                                          selectedRecipeIds.includes(recipe.id)
                                            ? "bg-[#5A5A40] text-white"
                                            : "bg-[#F5F5F0] text-[#5A5A40] hover:bg-[#E6E0D4]"
                                        )}
                                      >
                                        {selectedRecipeIds.includes(recipe.id) ? (
                                          <>
                                            <Check size={14} />
                                            {lang === 'fr' ? 'Ajouté' : 'Added to List'}
                                          </>
                                        ) : (
                                          <>
                                            <Plus size={14} />
                                            {lang === 'fr' ? 'Ajouter à la liste' : 'Add to Shopping List'}
                                          </>
                                        )}
                                      </button>

                                      <div className="relative group/planner">
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenPlannerId(openPlannerId === recipe.id ? null : recipe.id);
                                          }}
                                          className="px-4 py-2 bg-[#F5F5F0] text-[#5A5A40] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#E6E0D4] transition-all flex items-center gap-2"
                                        >
                                          <Calendar size={14} />
                                          {t('saveToPlanner')}
                                        </button>
                                        {/* Dropdown with bridge to prevent disappearing */}
                                        <div className={cn(
                                          "absolute top-full left-0 pt-1 z-10 min-w-[150px]",
                                          openPlannerId === recipe.id ? "block" : "hidden lg:group-hover/planner:block"
                                        )}>
                                          <div className="bg-white border border-[#E6E0D4] rounded-xl shadow-xl p-2">
                                            {DAYS_OF_WEEK.map(day => (
                                              <button 
                                                key={day}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  addToMealPlan(recipe, day);
                                                }}
                                                className="w-full text-left px-3 py-2 text-xs hover:bg-[#F5F5F0] rounded-lg transition-colors"
                                              >
                                                {t(`days.${day}`)}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 md:flex md:flex-col gap-4 md:items-end">
                                    <div className="flex items-center gap-1.5 text-[#5A5A40]">
                                      <Clock size={16} />
                                      <span className="text-sm font-semibold">{recipe.totalTime}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[#5A5A40]">
                                      <Users size={16} />
                                      <span className="text-sm font-semibold">{recipe.servings} {t('servings')}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[#5A5A40]">
                                      <DollarSign size={16} />
                                      <span className="text-sm font-semibold">{recipe.costPerPortion}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[#5A5A40]">
                                      <Flame size={16} />
                                      <span className="text-sm font-semibold">{recipe.caloriesPerPortion} {t('calories')}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[#5A5A40]">
                                      <Dumbbell size={16} />
                                      <span className="text-sm font-semibold">{recipe.proteinPerPortion} {t('protein')}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-[#F5F5F0]">
                                  <div>
                                    <div className="flex items-center justify-between mb-4">
                                      <h4 className="text-xs font-bold uppercase tracking-widest text-[#8E8E8E]">{t('ingredients')}</h4>
                                      <button 
                                        onClick={() => copyMissingIngredients(recipe)}
                                        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#5A5A40] hover:opacity-70 transition-opacity"
                                      >
                                        {copiedId === recipe.id ? (
                                          <>
                                            <Check size={12} className="text-green-600" />
                                            {t('copied')}
                                          </>
                                        ) : (
                                          <>
                                            <Copy size={12} />
                                            {t('copyMissing')}
                                          </>
                                        )}
                                      </button>
                                    </div>
                                    <ul className="space-y-2">
                                      {recipe.ingredients.map((ing, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                          <span className={cn(
                                            "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                                            ing.isMissing ? "bg-orange-400" : "bg-green-400"
                                          )} />
                                          <span className={cn(
                                            ing.isMissing ? "text-[#8E8E8E]" : "text-[#2D2D2D]"
                                          )}>
                                            <span className="font-semibold">{ing.amount}</span> {ing.name}
                                            {ing.isMissing && <span className="ml-2 text-[10px] italic">({t('missingIngredients')})</span>}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div>
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#8E8E8E] mb-4">{t('instructions')}</h4>
                                    <ol className="space-y-4">
                                      {recipe.instructions.map((step, i) => (
                                        <li key={i} className="flex gap-4 text-sm">
                                          <span className="font-serif italic text-[#5A5A40] opacity-30 text-lg leading-none">{i + 1}</span>
                                          <p className="leading-relaxed">{step}</p>
                                        </li>
                                      ))}
                                    </ol>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        {/* Load More Button */}
                        <div className="flex justify-center pt-4 pb-12">
                          <button
                            onClick={() => generateRecipes(true)}
                            disabled={loadingMore}
                            className="px-8 py-4 bg-white border border-[#E6E0D4] text-[#5A5A40] rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-[#F5F5F0] transition-all disabled:opacity-50 shadow-sm"
                          >
                            {loadingMore ? (
                              <>
                                <RefreshCw className="animate-spin" size={18} />
                                {t('generating')}
                              </>
                            ) : (
                              <>
                                <Plus size={18} />
                                {t('generateMore')}
                              </>
                            )}
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="no-search-results"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-[60vh] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-[#E6E0D4] rounded-[48px]"
                      >
                        <div className="w-20 h-20 bg-[#F5F5F0] rounded-full flex items-center justify-center text-[#5A5A40] mb-6">
                          <Search size={32} />
                        </div>
                        <h2 className="text-2xl font-serif font-bold mb-3">{t('readyToCook')}</h2>
                        <p className="text-[#8E8E8E] max-w-md mx-auto leading-relaxed">
                          {t('noRecipes')}
                        </p>
                      </motion.div>
                    )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <motion.div 
              key="favorites-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-serif font-bold">{t('favorites')}</h2>
                <span className="text-sm text-[#8E8E8E]">{favorites.length} {lang === 'fr' ? 'recettes enregistrées' : 'recipes saved'}</span>
              </div>
              
              {favorites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
                  {favorites.map((recipe, idx) => (
                    <motion.div 
                      key={recipe.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white rounded-[32px] overflow-hidden border border-[#E6E0D4] shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="p-8">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                          <div>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {recipe.dietaryTags.map(tag => (
                                <span key={tag} className="px-2 py-1 bg-green-50 text-green-700 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                  {tag}
                                </span>
                              ))}
                              <span className="px-2 py-1 bg-[#F5F5F0] text-[#5A5A40] rounded-md text-[10px] font-bold uppercase tracking-wider">
                                {recipe.cuisine}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4 mb-2">
                              <h3 className="text-2xl font-serif font-bold">{recipe.title}</h3>
                              <button 
                                onClick={() => toggleFavorite(recipe)}
                                className={cn(
                                  "p-2 rounded-full transition-all",
                                  isFavorite(recipe.id) ? "text-red-500 bg-red-50" : "text-[#8E8E8E] hover:bg-[#F5F5F0]"
                                )}
                                title={isFavorite(recipe.id) ? t('removeFromFavorites') : t('addToFavorites')}
                              >
                                <Heart size={20} className={cn(isFavorite(recipe.id) && "fill-current")} />
                              </button>
                            </div>
                            <p className="text-[#5A5A40] text-sm leading-relaxed max-w-2xl">{recipe.description}</p>
                            
                            <div className="flex flex-wrap gap-3 mt-4">
                              <button 
                                onClick={() => toggleRecipeSelection(recipe.id)}
                                className={cn(
                                  "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2",
                                  selectedRecipeIds.includes(recipe.id)
                                    ? "bg-[#5A5A40] text-white"
                                    : "bg-[#F5F5F0] text-[#5A5A40] hover:bg-[#E6E0D4]"
                                )}
                              >
                                {selectedRecipeIds.includes(recipe.id) ? (
                                  <>
                                    <Check size={14} />
                                    {lang === 'fr' ? 'Ajouté' : 'Added to List'}
                                  </>
                                ) : (
                                  <>
                                    <Plus size={14} />
                                    {lang === 'fr' ? 'Ajouter à la liste' : 'Add to Shopping List'}
                                  </>
                                )}
                              </button>

                              <div className="relative group/planner">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenPlannerId(openPlannerId === recipe.id ? null : recipe.id);
                                  }}
                                  className="px-4 py-2 bg-[#F5F5F0] text-[#5A5A40] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#E6E0D4] transition-all flex items-center gap-2"
                                >
                                  <Calendar size={14} />
                                  {t('saveToPlanner')}
                                </button>
                                {/* Dropdown with bridge to prevent disappearing */}
                                <div className={cn(
                                  "absolute top-full left-0 pt-1 z-10 min-w-[150px]",
                                  openPlannerId === recipe.id ? "block" : "hidden lg:group-hover/planner:block"
                                )}>
                                  <div className="bg-white border border-[#E6E0D4] rounded-xl shadow-xl p-2">
                                    {DAYS_OF_WEEK.map(day => (
                                      <button 
                                        key={day}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          addToMealPlan(recipe, day);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs hover:bg-[#F5F5F0] rounded-lg transition-colors"
                                      >
                                        {t(`days.${day}`)}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:flex md:flex-col gap-4 md:items-end">
                            <div className="flex items-center gap-1.5 text-[#5A5A40]">
                              <Clock size={16} />
                              <span className="text-sm font-semibold">{recipe.totalTime}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[#5A5A40]">
                              <Users size={16} />
                              <span className="text-sm font-semibold">{recipe.servings} {t('servings')}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[#5A5A40]">
                              <DollarSign size={16} />
                              <span className="text-sm font-semibold">{recipe.costPerPortion}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[#5A5A40]">
                              <Flame size={16} />
                              <span className="text-sm font-semibold">{recipe.caloriesPerPortion} {t('calories')}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[#5A5A40]">
                              <Dumbbell size={16} />
                              <span className="text-sm font-semibold">{recipe.proteinPerPortion} {t('protein')}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-[#F5F5F0]">
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-xs font-bold uppercase tracking-widest text-[#8E8E8E]">{t('ingredients')}</h4>
                              <button 
                                onClick={() => copyMissingIngredients(recipe)}
                                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#5A5A40] hover:opacity-70 transition-opacity"
                              >
                                {copiedId === recipe.id ? (
                                  <>
                                    <Check size={12} className="text-green-600" />
                                    {t('copied')}
                                  </>
                                ) : (
                                  <>
                                    <Copy size={12} />
                                    {t('copyMissing')}
                                  </>
                                )}
                              </button>
                            </div>
                            <ul className="space-y-2">
                              {recipe.ingredients.map((ing, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                  <span className={cn(
                                    "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                                    ing.isMissing ? "bg-orange-400" : "bg-green-400"
                                  )} />
                                  <span className={cn(
                                    ing.isMissing ? "text-[#8E8E8E]" : "text-[#2D2D2D]"
                                  )}>
                                    <span className="font-semibold">{ing.amount}</span> {ing.name}
                                    {ing.isMissing && <span className="ml-2 text-[10px] italic">({t('missingIngredients')})</span>}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-[#8E8E8E] mb-4">{t('instructions')}</h4>
                            <ol className="space-y-4">
                              {recipe.instructions.map((step, i) => (
                                <li key={i} className="flex gap-4 text-sm">
                                  <span className="font-serif italic text-[#5A5A40] opacity-30 text-lg leading-none">{i + 1}</span>
                                  <p className="leading-relaxed">{step}</p>
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="h-[40vh] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-[#E6E0D4] rounded-[48px]">
                  <div className="w-16 h-16 bg-[#F5F5F0] rounded-full flex items-center justify-center text-[#5A5A40] mb-4">
                    <Heart size={24} />
                  </div>
                  <p className="text-[#8E8E8E] max-w-xs mx-auto leading-relaxed">
                    {t('noFavorites')}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      )}

          {activeTab === 'pantry' && (
            <motion.div 
              key="pantry-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white p-5 sm:p-8 rounded-[32px] sm:rounded-[48px] border border-[#E6E0D4] shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#F5F5F0] rounded-full flex items-center justify-center text-[#5A5A40]">
                      <Box size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-serif font-bold">{t('kitchenInventory')}</h2>
                      <p className="text-[#8E8E8E] text-sm">{lang === 'fr' ? 'Gérez votre stock dans le garde-manger, le frigo et le congélateur.' : 'Manage your stock across pantry, fridge, and freezer.'}</p>
                    </div>
                  </div>

                  <div className="flex bg-[#F5F5F0] p-1 rounded-full w-full lg:w-auto lg:min-w-[400px]">
                    {(['pantry', 'refrigerator', 'freezer'] as InventoryCategory[]).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveInventoryTab(tab)}
                        className={cn(
                          "flex-1 px-2 sm:px-4 py-2 rounded-full text-[9px] sm:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap text-center",
                          activeInventoryTab === tab 
                            ? "bg-white text-[#5A5A40] shadow-sm" 
                            : "text-[#8E8E8E] hover:text-[#5A5A40]"
                        )}
                      >
                        {t(tab)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-12">
                  {(activeInventoryTab === 'pantry' ? PANTRY_STAPLES : 
                    activeInventoryTab === 'refrigerator' ? REFRIGERATOR_STAPLES : 
                    FREEZER_STAPLES).map(staple => (
                    <button
                      key={staple}
                      onClick={() => togglePantryStaple(staple)}
                      className={cn(
                        "px-3 py-2 rounded-full border text-[11px] font-medium transition-all flex items-center justify-between group",
                        inventory[activeInventoryTab].includes(staple)
                          ? "bg-[#5A5A40] text-white border-[#5A5A40]"
                          : "bg-white text-[#5A5A40] border-[#E6E0D4] hover:border-[#5A5A40]"
                      )}
                    >
                      <span className="truncate pr-1">{t(`staples.${staple}`)}</span>
                      {inventory[activeInventoryTab].includes(staple) ? (
                        <Check size={12} className="shrink-0" />
                      ) : (
                        <Plus size={12} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  ))}

                  {customInventory[activeInventoryTab].map(item => (
                    <div
                      key={item}
                      className={cn(
                        "px-3 py-2 rounded-full border text-[11px] font-medium transition-all flex items-center justify-between group",
                        inventory[activeInventoryTab].includes(item)
                          ? "bg-[#5A5A40] text-white border-[#5A5A40]"
                          : "bg-white text-[#5A5A40] border-[#E6E0D4] hover:border-[#5A5A40]"
                      )}
                    >
                      <button 
                        onClick={() => togglePantryStaple(item)}
                        className="flex-1 text-left truncate pr-1"
                      >
                        {item}
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        {inventory[activeInventoryTab].includes(item) && <Check size={12} />}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCustomInventoryItem(item, activeInventoryTab);
                          }}
                          className={cn(
                            "hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-black/5",
                            inventory[activeInventoryTab].includes(item) ? "hover:bg-white/20" : ""
                          )}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-12">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#8E8E8E] mb-4">
                    {t('addTo')} {t(activeInventoryTab)}
                  </h3>
                  <form onSubmit={addCustomPantryStaple} className="flex flex-col gap-3 max-w-md">
                    <input 
                      type="text"
                      value={inputPantryStaple}
                      onChange={(e) => setInputPantryStaple(e.target.value)}
                      placeholder={`e.g. ${activeInventoryTab === 'freezer' ? (lang === 'fr' ? 'Petits pois' : 'Frozen Peas') : activeInventoryTab === 'refrigerator' ? (lang === 'fr' ? 'Yaourt grec' : 'Greek Yogurt') : (lang === 'fr' ? 'Miel' : 'Honey')}`}
                      className="w-full px-4 py-3 bg-[#F5F5F0] rounded-2xl border-none focus:ring-2 focus:ring-[#5A5A40] text-sm"
                    />
                    <button 
                      type="submit"
                      className="w-full sm:w-auto px-6 py-3 bg-[#5A5A40] text-white rounded-2xl font-semibold hover:bg-[#4A4A35] transition-colors"
                    >
                      {t('add')}
                    </button>
                  </form>
                </div>

                <div className="mt-12 p-6 bg-[#F5F5F0] rounded-3xl">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-[#8E8E8E] mb-4">{lang === 'fr' ? 'Gestion de l\'inventaire' : 'Inventory Management'}</h3>
                  <p className="text-sm text-[#5A5A40] leading-relaxed">
                    {lang === 'fr' 
                      ? `Gardez une trace de ce qu'il y a dans votre ${t(activeInventoryTab)}. Le Chef Virtuel utilisera ces informations pour suggérer des recettes utilisant votre stock existant, vous faisant économiser de l'argent et réduisant le gaspillage alimentaire.`
                      : `Keep track of what's in your ${activeInventoryTab}. The Meal Maker will use this information to suggest recipes that utilize your existing stock, saving you money and reducing food waste.`}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'planner' && (
            <motion.div 
              key="planner-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#F5F5F0] rounded-full flex items-center justify-center text-[#5A5A40]">
                      <Calendar size={24} />
                    </div>
                    <h2 className="text-2xl font-serif font-bold">{t('weeklyPlanner')}</h2>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <form onSubmit={addNoteToPlanner} className="flex items-center gap-2 bg-[#F5F5F0] p-1.5 rounded-2xl border border-[#E6E0D4]">
                      <input 
                        type="text"
                        value={inputNote}
                        onChange={(e) => setInputNote(e.target.value)}
                        placeholder={lang === 'fr' ? 'Ajouter une note (ex: Resto)' : 'Add a note (e.g. Take-out)'}
                        className="bg-transparent border-none focus:ring-0 text-xs px-3 py-1.5 w-40 sm:w-60"
                      />
                      <button 
                        type="submit"
                        className="bg-[#5A5A40] text-white p-1.5 rounded-xl hover:scale-105 transition-transform"
                      >
                        <Plus size={16} />
                      </button>
                    </form>
                    
                    <button 
                      onClick={() => setMealPlan({})}
                      className="text-xs font-bold uppercase tracking-widest text-red-500 hover:opacity-70 transition-opacity"
                    >
                      {t('clearAll')}
                    </button>
                  </div>
                </div>

              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                  {DAYS_OF_WEEK.map(day => (
                    <DroppableDay 
                      key={day} 
                      day={t(`days.${day}`)} 
                      items={mealPlan[day] || []} 
                      onRecipeClick={setViewingPlannerRecipe}
                      onRemove={removeFromMealPlan}
                      isFavorite={isFavorite}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>

                <DragOverlay dropAnimation={{
                  sideEffects: defaultDropAnimationSideEffects({
                    styles: {
                      active: {
                        opacity: '0.5',
                      },
                    },
                  }),
                }}>
                  {activeId && activeItem ? (
                    <div className={cn(
                      "p-3 rounded-2xl shadow-2xl border-2 border-[#5A5A40] scale-105 rotate-2",
                      'type' in activeItem && activeItem.type === 'note' ? "bg-orange-50" : "bg-white"
                    )}>
                      <h4 className="text-xs font-bold leading-tight pr-4">
                        {'type' in activeItem && activeItem.type === 'note' ? (activeItem as Note).text : (activeItem as Recipe).title}
                      </h4>
                      {!('type' in activeItem && activeItem.type === 'note') && (
                        <div className="flex items-center gap-2 mt-2 opacity-60">
                          <Clock size={10} />
                          <span className="text-[10px]">{(activeItem as Recipe).totalTime}</span>
                        </div>
                      )}
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Recipe Detail Modal (for Planner) */}
      <AnimatePresence>
        {viewingPlannerRecipe && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingPlannerRecipe(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-4 md:inset-20 bg-white z-[110] rounded-[48px] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 md:p-10 border-b border-[#F5F5F0] flex items-center justify-between bg-white sticky top-0">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl md:text-3xl font-serif font-bold">{viewingPlannerRecipe.title}</h2>
                  <button
                    onClick={() => toggleFavorite(viewingPlannerRecipe)}
                    className={cn(
                      "p-2 rounded-full transition-all hover:scale-110 active:scale-95",
                      isFavorite(viewingPlannerRecipe.id) ? "text-red-500 bg-red-50" : "text-[#8E8E8E] hover:text-red-500 bg-[#F5F5F0]"
                    )}
                    title={isFavorite(viewingPlannerRecipe.id) ? t('removeFromFavorites') : t('addToFavorites')}
                  >
                    <Heart size={20} className={cn(isFavorite(viewingPlannerRecipe.id) && "fill-current")} />
                  </button>
                </div>
                <button 
                  onClick={() => setViewingPlannerRecipe(null)}
                  className="w-10 h-10 bg-[#F5F5F0] rounded-full flex items-center justify-center text-[#5A5A40] hover:bg-[#E6E0D4] transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 md:p-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <div className="lg:col-span-1 space-y-8">
                    <div className="bg-[#F5F5F0] p-6 rounded-3xl space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#8E8E8E] font-medium">{lang === 'fr' ? 'Temps' : 'Time'}</span>
                        <span className="font-bold">{viewingPlannerRecipe.totalTime}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#8E8E8E] font-medium">{lang === 'fr' ? 'Portions' : 'Servings'}</span>
                        <span className="font-bold">{viewingPlannerRecipe.servings}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#8E8E8E] font-medium">Calories</span>
                        <span className="font-bold">{viewingPlannerRecipe.caloriesPerPortion} kcal</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#8E8E8E] font-medium">{lang === 'fr' ? 'Protéines' : 'Protein'}</span>
                        <span className="font-bold">{viewingPlannerRecipe.proteinPerPortion}</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[#8E8E8E] mb-4">{t('ingredients')}</h3>
                      <ul className="space-y-3">
                        {viewingPlannerRecipe.ingredients.map((ing, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm">
                            <span className="w-1.5 h-1.5 rounded-full mt-1.5 bg-[#5A5A40] shrink-0" />
                            <span><span className="font-bold">{ing.amount}</span> {ing.name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-8">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[#8E8E8E] mb-4">{t('instructions')}</h3>
                      <ol className="space-y-6">
                        {viewingPlannerRecipe.instructions.map((step, i) => (
                          <li key={i} className="flex gap-6">
                            <span className="font-serif italic text-4xl text-[#5A5A40] opacity-20 leading-none shrink-0">{i + 1}</span>
                            <p className="text-base leading-relaxed text-[#2D2D2D]">{step}</p>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Shopping List Sidebar/Overlay */}
      <AnimatePresence>
        {showShoppingList && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShoppingList(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-[70] shadow-2xl border-l border-[#E6E0D4] flex flex-col"
            >
              <div className="p-6 border-b border-[#E6E0D4] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#F5F5F0] rounded-full flex items-center justify-center text-[#5A5A40]">
                    <ShoppingCart size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-serif font-bold">{t('shoppingListTitle')}</h2>
                    <p className="text-xs text-[#8E8E8E]">{selectedRecipeIds.length} {t('recipesSelected')}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowShoppingList(false)}
                  className="w-8 h-8 rounded-full hover:bg-[#F5F5F0] flex items-center justify-center transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {selectedRecipes.length > 0 ? (
                  <>
                    <section>
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#8E8E8E] mb-4">{t('recipesInPlan')}</h3>
                      <div className="space-y-3">
                        {selectedRecipes.map(recipe => (
                          <div key={recipe.id} className="flex items-center justify-between p-3 bg-[#F5F5F0] rounded-2xl group">
                            <span className="text-sm font-medium truncate pr-4">{recipe.title}</span>
                            <button 
                              onClick={() => toggleRecipeSelection(recipe.id)}
                              className="text-[#8E8E8E] hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#8E8E8E]">{t('missingIngredients')}</h3>
                        <button 
                          onClick={copyFullShoppingList}
                          className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A40] flex items-center gap-1.5 hover:opacity-70"
                        >
                          {copiedId === 'full-list' ? (
                            <>
                              <Check size={12} className="text-green-600" />
                              {t('copied')}
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              {t('copyFullList')}
                            </>
                          )}
                        </button>
                      </div>
                      <div className="bg-white border border-[#E6E0D4] rounded-2xl divide-y divide-[#F5F5F0]">
                        {aggregateMissingIngredients().length > 0 ? (
                          aggregateMissingIngredients().map((item, i) => (
                            <div key={i} className="p-4 flex items-center gap-3">
                              <div className="w-4 h-4 rounded border border-[#E6E0D4] shrink-0" />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium capitalize">{item.name}</span>
                                <span className="text-xs text-[#8E8E8E]">{item.amount}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-sm text-[#8E8E8E] italic">
                            {lang === 'fr' ? 'Aucun ingrédient manquant ! Vous avez tout ce qu\'il faut.' : 'No missing ingredients! You have everything you need.'}
                          </div>
                        )}
                      </div>
                    </section>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-[#F5F5F0] rounded-full flex items-center justify-center text-[#8E8E8E]">
                      <Utensils size={24} />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold">{lang === 'fr' ? 'Votre liste est vide' : 'Your list is empty'}</h3>
                      <p className="text-sm text-[#8E8E8E] max-w-[200px] mx-auto mt-2">
                        {lang === 'fr' ? 'Ajoutez des recettes pour générer une liste de courses.' : 'Add recipes from your search results to generate a shopping list.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {selectedRecipes.length > 0 && (
                <div className="p-6 border-t border-[#E6E0D4] bg-[#FDFCFB] flex flex-col gap-3">
                  <button 
                    onClick={copyFullShoppingList}
                    className="w-full py-4 bg-[#5A5A40] text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-[#4A4A35] transition-colors shadow-lg shadow-[#5A5A40]/20"
                  >
                    <Copy size={18} />
                    {t('copyFullList')}
                  </button>
                  <button 
                    onClick={() => setShowShoppingList(false)}
                    className="w-full py-3 text-[#5A5A40] font-medium hover:bg-[#F5F5F0] rounded-xl transition-colors"
                  >
                    {t('close')}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Back to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-[90] bg-[#5A5A40] text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 hover:bg-[#4A4A35] transition-colors group"
          >
            <ArrowUp size={18} className="group-hover:-translate-y-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-wider pr-1">{t('backToTop')}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-20 border-t border-[#E6E0D4] py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-[#8E8E8E] mb-4">© 2026 {t('appName')}. {lang === 'fr' ? 'Propulsé par Gemini AI.' : 'Powered by Gemini AI.'}</p>
          <div className="flex justify-center gap-6 text-[#5A5A40] font-medium text-xs uppercase tracking-widest">
            <a href="#" className="hover:opacity-70 transition-opacity">{lang === 'fr' ? 'Confidentialité' : 'Privacy'}</a>
            <a href="#" className="hover:opacity-70 transition-opacity">{lang === 'fr' ? 'Conditions' : 'Terms'}</a>
            <a href="#" className="hover:opacity-70 transition-opacity">{lang === 'fr' ? 'Support' : 'Support'}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
