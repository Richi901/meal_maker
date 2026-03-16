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
  ChevronDown,
  ArrowUp,
  Calendar,
  Box,
  Users,
  Dumbbell,
  GripVertical,
  Menu,
  Heart,
  Edit2,
  Settings,
  Moon,
  Sun
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
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  getDocs,
  handleFirestoreError,
  OperationType
} from './firebase';
import { User } from 'firebase/auth';

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

const COLOR_SCHEMES = [
  {
    id: 'classic',
    primary: '#5A5A40',
    secondary: '#F5F5F0',
    accent: '#E6E0D4',
    bg: '#FDFCFB',
    text: '#2D2D2D'
  },
  {
    id: 'dark',
    primary: '#FFFFFF',
    secondary: '#1A1A1A',
    accent: '#333333',
    bg: '#0A0A0A',
    text: '#F5F5F5'
  },
  {
    id: 'ocean',
    primary: '#1E3A8A',
    secondary: '#DBEAFE',
    accent: '#BFDBFE',
    bg: '#F8FAFC',
    text: '#2D2D2D'
  },
  {
    id: 'forest',
    primary: '#064E3B',
    secondary: '#D1FAE5',
    accent: '#A7F3D0',
    bg: '#F0FDF4',
    text: '#2D2D2D'
  },
  {
    id: 'sunset',
    primary: '#7C2D12',
    secondary: '#FFEDD5',
    accent: '#FED7AA',
    bg: '#FFF7ED',
    text: '#2D2D2D'
  },
  {
    id: 'berry',
    primary: '#701A75',
    secondary: '#FAE8FF',
    accent: '#F5D0FE',
    bg: '#FDF4FF',
    text: '#2D2D2D'
  },
  {
    id: 'slate',
    primary: '#0F172A',
    secondary: '#F1F5F9',
    accent: '#E2E8F0',
    bg: '#F8FAFC',
    text: '#2D2D2D'
  },
  {
    id: 'rose',
    primary: '#881337',
    secondary: '#FFE4E6',
    accent: '#FECDD3',
    bg: '#FFF1F2',
    text: '#2D2D2D'
  },
  {
    id: 'amber',
    primary: '#78350F',
    secondary: '#FEF3C7',
    accent: '#FDE68A',
    bg: '#FFFBEB',
    text: '#2D2D2D'
  },
  {
    id: 'brutalist',
    primary: '#000000',
    secondary: '#00FF00',
    accent: '#FFFFFF',
    bg: '#FFFFFF',
    text: '#000000'
  }
];

const FREEZER_STAPLES = [
  "Frozen Peas", "Frozen Corn", "Frozen Berries", "Chicken Breast", "Ground Beef", "Fish Fillets", "Frozen Spinach", "Ice Cream"
];

const PANTRY_CATEGORIES = [
  "Spices",
  "Produce",
  "Canned goods and proteins",
  "Grains and starches",
  "Baking",
  "Oil/vinegar and condiments",
  "Snack and breakfast",
  "Beverages",
  "Others"
] as const;

const REFRIGERATOR_CATEGORIES = [
  "Condiments and drinks",
  "Meat Poultry and Seafood",
  "Dairy Products and eggs",
  "Fruits and vegetables",
  "Others"
] as const;

const FREEZER_CATEGORIES = [
  "Meat Poultry and Seafood",
  "Ready Meals",
  "Vegetable and Fruits",
  "Grains and bread",
  "Others"
] as const;

type ItemCategory = typeof PANTRY_CATEGORIES[number] | typeof REFRIGERATOR_CATEGORIES[number] | typeof FREEZER_CATEGORIES[number];

const STAPLE_CATEGORY_MAP: Record<string, ItemCategory> = {
  // Pantry
  "Salt": "Spices",
  "Black Pepper": "Spices",
  "Garlic Powder": "Spices",
  "Onion Powder": "Spices",
  "Dried Oregano": "Spices",
  "Dried Basil": "Spices",
  "Olive Oil": "Oil/vinegar and condiments",
  "Vegetable Oil": "Oil/vinegar and condiments",
  "Soy Sauce": "Oil/vinegar and condiments",
  "Vinegar": "Oil/vinegar and condiments",
  "Honey": "Oil/vinegar and condiments",
  "Flour": "Baking",
  "Sugar": "Baking",
  "Rice": "Grains and starches",
  "Pasta": "Grains and starches",
  "Canned Tomatoes": "Canned goods and proteins",
  "Beans": "Canned goods and proteins",
  // Refrigerator
  "Milk": "Condiments and drinks",
  "Eggs": "Dairy Products and eggs",
  "Butter": "Dairy Products and eggs",
  "Cheese": "Dairy Products and eggs",
  "Yogurt": "Dairy Products and eggs",
  "Carrots": "Fruits and vegetables",
  "Onions": "Fruits and vegetables",
  "Garlic": "Fruits and vegetables",
  "Ginger": "Fruits and vegetables",
  "Lemons": "Fruits and vegetables",
  "Limes": "Fruits and vegetables",
  "Mayonnaise": "Condiments and drinks",
  "Mustard": "Condiments and drinks",
  "Ketchup": "Condiments and drinks",
  // Freezer
  "Frozen Peas": "Vegetable and Fruits",
  "Frozen Corn": "Vegetable and Fruits",
  "Frozen Berries": "Vegetable and Fruits",
  "Chicken Breast": "Meat Poultry and Seafood",
  "Ground Beef": "Meat Poultry and Seafood",
  "Fish Fillets": "Meat Poultry and Seafood",
  "Frozen Spinach": "Vegetable and Fruits",
  "Ice Cream": "Others"
};

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

function DraggableMealItem({ 
  item, 
  day, 
  onRecipeClick, 
  onRemove, 
  isFavorite, 
  onToggleFavorite, 
  onEditNote,
  editingNote,
  onUpdateNote,
  onCancelEdit,
  onViewDetails
}: { 
  item: MealItem, 
  day: string, 
  onRecipeClick: (r: Recipe) => void, 
  onRemove: (id: string, day: string) => void,
  isFavorite?: (id: string) => boolean,
  onToggleFavorite?: (r: Recipe) => void,
  onEditNote?: (id: string, dayKey: string, text: string) => void,
  editingNote?: { id: string, dayKey: string, text: string } | null,
  onUpdateNote?: (e: React.FormEvent) => void,
  onCancelEdit?: () => void,
  onViewDetails?: (id: string, dayKey: string, note: Note) => void
}) {
  const isNote = 'type' in item && item.type === 'note';
  const isEditing = isNote && editingNote?.id === item.id && editingNote?.dayKey === day;

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
        isNote ? "bg-orange-50 border border-orange-100 hover:bg-orange-100" : "bg-[var(--secondary)] hover:bg-[var(--accent)]"
      )}
      onClick={() => {
        if (!isNote) {
          onRecipeClick(item as Recipe);
        } else if (!isEditing && onViewDetails) {
          onViewDetails(item.id, day, item as Note);
        }
      }}
    >
      <div {...attributes} {...listeners} className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center text-[#8E8E8E] opacity-100 lg:opacity-0 lg:group-hover:opacity-100 cursor-grab active:cursor-grabbing z-10">
        <GripVertical size={16} />
      </div>
      <div className="pl-8">
        <div className="flex items-start justify-between gap-2">
          {isEditing ? (
            <form 
              onSubmit={onUpdateNote} 
              className="flex-1"
              onClick={(e) => e.stopPropagation()}
            >
              <input 
                autoFocus
                type="text"
                value={editingNote.text}
                onChange={(e) => onEditNote?.(item.id, day, e.target.value)}
                onBlur={onUpdateNote}
                className="w-full bg-white border border-orange-200 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-orange-500 outline-none"
              />
            </form>
          ) : (
            <h4 className="text-xs font-bold leading-tight pr-4">
              {isNote ? (item as Note).text || <span className="text-[#8E8E8E] italic">Empty note...</span> : (item as Recipe).title}
            </h4>
          )}
          <div className="flex items-center gap-1 shrink-0">
            {isNote && !isEditing && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditNote?.(item.id, day, (item as Note).text);
                  }}
                  className="text-[#8E8E8E] hover:text-[var(--primary)] transition-colors p-1"
                >
                  <Edit2 size={12} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails?.(item.id, day, item as Note);
                  }}
                  className="text-[#8E8E8E] hover:text-[var(--primary)] transition-colors p-1"
                >
                  <ChevronRight size={12} />
                </button>
              </>
            )}
            {!isNote && isFavorite && onToggleFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(item as Recipe);
                }}
                className={cn(
                  "shrink-0 transition-colors p-1",
                  isFavorite(item.id) ? "text-red-500" : "text-[#8E8E8E] hover:text-red-500"
                )}
              >
                <Heart size={12} className={cn(isFavorite(item.id) && "fill-current")} />
              </button>
            )}
          </div>
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

function DroppableDay({ 
  day, 
  dayKey, 
  items, 
  onRecipeClick, 
  onRemove, 
  isFavorite, 
  onToggleFavorite, 
  onEditNote,
  editingNote,
  onUpdateNote,
  onCancelEdit,
  onAddNote,
  onViewDetails
}: { 
  day: string, 
  dayKey: string,
  items: MealItem[], 
  onRecipeClick: (r: Recipe) => void,
  onRemove: (id: string, dayKey: string) => void,
  isFavorite: (id: string) => boolean,
  onToggleFavorite: (r: Recipe) => void,
  onEditNote: (id: string, dayKey: string, text: string) => void,
  editingNote: { id: string, dayKey: string, text: string } | null,
  onUpdateNote: (e: React.FormEvent) => void,
  onCancelEdit: () => void,
  onAddNote: (dayKey: string) => void,
  onViewDetails: (id: string, dayKey: string, note: Note) => void
}) {
  const { setNodeRef, isOver } = useSortable({ id: dayKey });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[#8E8E8E]">{day}</h3>
        <button 
          onClick={() => onAddNote(dayKey)}
          className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-orange-100 transition-colors"
        >
          <Plus size={10} />
          Note
        </button>
      </div>
      <div 
        ref={setNodeRef}
        className={cn(
          "flex-1 min-h-[120px] md:min-h-[200px] bg-[var(--bg)] border rounded-3xl p-3 space-y-3 transition-colors",
          isOver ? "bg-[var(--secondary)] border-[var(--primary)]" : "border-[var(--accent)]"
        )}
      >
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {items.length > 0 ? (
            items.map(item => (
              <DraggableMealItem 
                key={item.id} 
                item={item} 
                day={dayKey} 
                onRecipeClick={onRecipeClick} 
                onRemove={onRemove} 
                isFavorite={isFavorite}
                onToggleFavorite={onToggleFavorite}
                onEditNote={onEditNote}
                editingNote={editingNote}
                onUpdateNote={onUpdateNote}
                onCancelEdit={onCancelEdit}
                onViewDetails={onViewDetails}
              />
            ))
          ) : (
            <div className="h-full flex items-center justify-center border-2 border-dashed border-[var(--secondary)] rounded-2xl">
              <span className="text-[10px] text-[#8E8E8E] italic">No meals</span>
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}

type InventoryCategory = 'pantry' | 'refrigerator' | 'freezer';

const COMMON_INGREDIENTS = [
  "Chicken Breast", "Ground Beef", "Salmon Fillet", "Tofu", "Eggs", "Milk", "Greek Yogurt", "Butter", "Cheddar Cheese", "Parmesan",
  "Onions", "Garlic", "Ginger", "Spinach", "Kale", "Broccoli", "Carrots", "Bell Peppers", "Tomatoes", "Potatoes", "Sweet Potatoes",
  "Lemons", "Limes", "Apples", "Bananas", "Avocado", "Cilantro", "Parsley", "Basil", "Oregano", "Thyme", "Rosemary",
  "Olive Oil", "Vegetable Oil", "Soy Sauce", "Rice Vinegar", "Balsamic Vinegar", "Honey", "Maple Syrup", "Dijon Mustard", "Mayonnaise",
  "Rice", "Quinoa", "Pasta", "Flour", "Sugar", "Baking Powder", "Baking Soda", "Yeast", "Cornstarch",
  "Black Beans", "Chickpeas", "Lentils", "Canned Tomatoes", "Coconut Milk", "Chicken Broth", "Vegetable Broth",
  "Salt", "Black Pepper", "Paprika", "Cumin", "Coriander", "Turmeric", "Chili Powder", "Garlic Powder", "Onion Powder",
  "Frozen Peas", "Frozen Corn", "Frozen Berries", "Frozen Spinach", "Ice Cream",
  // Additional Items & Brands
  "Heinz Ketchup", "Hellmann's Mayonnaise", "Quaker Oats", "Barilla Pasta", "Kikkoman Soy Sauce", "Tabasco Hot Sauce", 
  "Nutella", "Philadelphia Cream Cheese", "Chobani Yogurt", "Tyson Chicken", "Beyond Meat", "Impossible Burger",
  "Shrimp", "Scallops", "Pork Chops", "Bacon", "Sausage", "Heavy Cream", "Sour Cream", "Feta Cheese", "Mozzarella",
  "Zucchini", "Eggplant", "Mushrooms", "Asparagus", "Blueberries", "Strawberries", "Raspberries", "Walnuts", "Almonds", 
  "Cashews", "Peanut Butter", "Almond Butter", "Chia Seeds", "Flax Seeds", "Couscous", "Bulgur", "Sesame Oil", 
  "Fish Sauce", "Sriracha", "Curry Paste", "Pesto", "Worcestershire Sauce", "Hoisin Sauce", "Oyster Sauce",
  "Almond Milk", "Oat Milk", "Coconut Water", "Greek Feta", "Goat Cheese", "Prosciutto", "Salami", "Turkey Breast"
];

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error) errorMessage = `Firestore Error: ${parsed.error}`;
      } catch (e) {
        errorMessage = this.state.error.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-6">
          <div className="max-w-md w-full bg-[var(--secondary)] p-8 rounded-[32px] shadow-xl text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-2xl font-serif font-bold">Oops!</h2>
            <p className="text-[#8E8E8E] text-sm leading-relaxed">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-[var(--primary)] text-[var(--bg)] rounded-xl font-bold text-sm hover:opacity-90 transition-all"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('mealmaker_lang');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('mealmaker_lang', lang.toString());
  }, [lang]);

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

  const [themeColors, setThemeColors] = useState(() => {
    const saved = localStorage.getItem('mealmaker_theme_colors');
    const defaults = COLOR_SCHEMES[0];
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  });

  const toggleDarkMode = () => {
    const isDark = themeColors.id === 'dark';
    const nextScheme = isDark 
      ? COLOR_SCHEMES.find(s => s.id === 'classic') || COLOR_SCHEMES[0]
      : COLOR_SCHEMES.find(s => s.id === 'dark') || COLOR_SCHEMES[1];
    setThemeColors(nextScheme);
  };

  useEffect(() => {
    document.documentElement.style.setProperty('--primary', themeColors.primary);
    document.documentElement.style.setProperty('--secondary', themeColors.secondary);
    document.documentElement.style.setProperty('--accent', themeColors.accent);
    document.documentElement.style.setProperty('--bg', themeColors.bg);
    document.documentElement.style.setProperty('--text', themeColors.text);
    localStorage.setItem('mealmaker_theme_colors', JSON.stringify(themeColors));
    if (themeColors.id === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeColors]);
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
  const [activeTab, setActiveTab] = useState<'recipes' | 'pantry' | 'planner' | 'settings'>('recipes');
  const [plannerMode, setPlannerMode] = useState<'week' | 'month'>(() => {
    const saved = localStorage.getItem('mealmaker_planner_mode');
    return (saved as 'week' | 'month') || 'week';
  });
  const [currentWeek, setCurrentWeek] = useState(1);
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
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>('Others');
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [customItemCategories, setCustomItemCategories] = useState<Record<string, ItemCategory>>(() => {
    const saved = localStorage.getItem('mealmaker_custom_item_categories');
    return saved ? JSON.parse(saved) : {};
  });
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    [...PANTRY_CATEGORIES, ...REFRIGERATOR_CATEGORIES, ...FREEZER_CATEGORIES].forEach(cat => {
      initial[cat] = false;
    });
    return initial;
  });
  const [mealPlan, setMealPlan] = useState<{ [key: string]: MealItem[] }>(() => {
    const saved = localStorage.getItem('mealmaker_mealplan');
    return saved ? JSON.parse(saved) : {};
  });
  const [viewingPlannerRecipe, setViewingPlannerRecipe] = useState<Recipe | null>(null);
  const [editingNote, setEditingNote] = useState<{ id: string, dayKey: string, text: string } | null>(null);
  const [viewingNoteDetails, setViewingNoteDetails] = useState<{ id: string, dayKey: string, note: Note } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<MealItem | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [recipeSubTab, setRecipeSubTab] = useState<'search' | 'favorites'>('search');
  const [favorites, setFavorites] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem('mealmaker_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [favoriteCategory, setFavoriteCategory] = useState<string>('Any');
  const [expandedFavoriteIds, setExpandedFavoriteIds] = useState<string[]>([]);
  const [openPlannerId, setOpenPlannerId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const [manualShoppingList, setManualShoppingList] = useState<string[]>(() => {
    const saved = localStorage.getItem('mealmaker_manual_shopping');
    return saved ? JSON.parse(saved) : [];
  });
  const [removedStaples, setRemovedStaples] = useState<{ [key in InventoryCategory]: string[] }>(() => {
    const saved = localStorage.getItem('mealmaker_removed_staples');
    return saved ? JSON.parse(saved) : { pantry: [], refrigerator: [], freezer: [] };
  });

  // Firebase State
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [household, setHousehold] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isProcessingHousehold, setIsProcessingHousehold] = useState(false);
  const [householdNameInput, setHouseholdNameInput] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');

  // Auth Effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Get or create user profile
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        } else {
          const newProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            householdId: null
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
          setUserProfile(newProfile);
        }
      } else {
        setUserProfile(null);
        setHousehold(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Household Sync Effect
  useEffect(() => {
    if (!userProfile?.householdId) {
      setHousehold(null);
      return;
    }

    const unsubHousehold = onSnapshot(doc(db, 'households', userProfile.householdId), (doc) => {
      if (doc.exists()) {
        setHousehold(doc.data());
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `households/${userProfile.householdId}`));

    const unsubInventory = onSnapshot(doc(db, 'inventory', userProfile.householdId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setInventory({
          pantry: data.pantry || [],
          refrigerator: data.refrigerator || [],
          freezer: data.freezer || []
        });
        setCustomInventory(data.customInventory || { pantry: [], refrigerator: [], freezer: [] });
        setCustomItemCategories(data.customItemCategories || {});
        setRemovedStaples(data.removedStaples || { pantry: [], refrigerator: [], freezer: [] });
        setManualShoppingList(data.manualShoppingList || []);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `inventory/${userProfile.householdId}`));

    const unsubMealPlan = onSnapshot(doc(db, 'mealPlans', userProfile.householdId), (doc) => {
      if (doc.exists()) {
        setMealPlan(doc.data().plan || {});
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `mealPlans/${userProfile.householdId}`));

    const unsubFavorites = onSnapshot(doc(db, 'favorites', userProfile.householdId), (doc) => {
      if (doc.exists()) {
        setFavorites(doc.data().recipes || []);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `favorites/${userProfile.householdId}`));

    return () => {
      unsubHousehold();
      unsubInventory();
      unsubMealPlan();
      unsubFavorites();
    };
  }, [userProfile?.householdId]);

  // Notification Auto-clear Effect
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Push Local Data to Firebase when joining a household for the first time
  const pushLocalDataToFirebase = async (householdId: string) => {
    setIsSyncing(true);
    const path = `inventory/${householdId}`;
    try {
      await setDoc(doc(db, 'inventory', householdId), {
        householdId,
        pantry: inventory.pantry,
        refrigerator: inventory.refrigerator,
        freezer: inventory.freezer,
        customInventory,
        customItemCategories,
        removedStaples,
        manualShoppingList
      });
      await setDoc(doc(db, 'mealPlans', householdId), {
        householdId,
        plan: mealPlan
      });
      await setDoc(doc(db, 'favorites', householdId), {
        householdId,
        recipes: favorites
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      // Always prefer signInWithPopup in this environment as per guidelines
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      // Ignore cancelled popup errors as they are usually user-triggered
      if (err.code === 'auth/cancelled-popup-request' || 
          err.code === 'auth/popup-closed-by-user' ||
          err.code === 'auth/user-cancelled') {
        // Do nothing
      } else if (err.code === 'auth/popup-blocked') {
        setNotification({ 
          message: lang === 'fr' 
            ? "Le popup a été bloqué. Veuillez autoriser les popups ou ouvrir l'application dans un nouvel onglet." 
            : "Popup was blocked. Please allow popups or open the app in a new tab.", 
          type: 'info' 
        });
      } else {
        console.error("Login error:", err);
        
        // Check if we are in an iframe
        const isInIframe = window.self !== window.top;
        if (isInIframe) {
          setNotification({ 
            message: lang === 'fr' 
              ? "La connexion peut échouer dans un aperçu. Essayez d'ouvrir l'application dans un nouvel onglet." 
              : "Login may fail in preview. Try opening the app in a new tab.", 
            type: 'info' 
          });
        } else {
          setNotification({ 
            message: lang === 'fr' ? "Erreur de connexion. Veuillez réessayer." : "Login error. Please try again.", 
            type: 'info' 
          });
        }
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const createHousehold = async () => {
    if (!user || !householdNameInput || isProcessingHousehold) return;
    setIsProcessingHousehold(true);
    const householdId = doc(collection(db, 'households')).id;
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const newHousehold = {
      id: householdId,
      name: householdNameInput,
      ownerId: user.uid,
      inviteCode,
      members: [user.uid]
    };

    try {
      await setDoc(doc(db, 'households', householdId), newHousehold);
      await updateDoc(doc(db, 'users', user.uid), { householdId });
      setUserProfile(prev => ({ ...prev, householdId }));
      
      // Push current local data to the new household
      await pushLocalDataToFirebase(householdId);
      setNotification({ message: t('householdCreated'), type: 'success' });
      setHouseholdNameInput('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `households/${householdId}`);
    } finally {
      setIsProcessingHousehold(false);
    }
  };

  const joinHousehold = async () => {
    if (!user || !inviteCodeInput || isProcessingHousehold) return;
    setIsProcessingHousehold(true);
    try {
      const q = query(collection(db, 'households'), where('inviteCode', '==', inviteCodeInput.toUpperCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const householdDoc = querySnapshot.docs[0];
        const householdId = householdDoc.id;
        const data = householdDoc.data();
        
        if (!data.members.includes(user.uid)) {
          await updateDoc(doc(db, 'households', householdId), {
            members: [...data.members, user.uid]
          });
        }
        
        await updateDoc(doc(db, 'users', user.uid), { householdId });
        setUserProfile(prev => ({ ...prev, householdId }));
        setNotification({ message: t('householdJoined'), type: 'success' });
        setInviteCodeInput('');
      } else {
        setNotification({ message: t('errorJoiningHousehold'), type: 'info' });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'households');
    } finally {
      setIsProcessingHousehold(false);
    }
  };

  const leaveHousehold = async () => {
    if (!user || !userProfile.householdId || !household) return;
    
    try {
      const newMembers = household.members.filter((m: string) => m !== user.uid);
      if (newMembers.length === 0) {
        // Optional: delete household if last member leaves
      } else {
        await updateDoc(doc(db, 'households', userProfile.householdId), {
          members: newMembers
        });
      }
      
      await updateDoc(doc(db, 'users', user.uid), { householdId: null });
      setUserProfile(prev => ({ ...prev, householdId: null }));
      setHousehold(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `households/${userProfile.householdId}`);
    }
  };

  // Debounced Sync to Firestore
  useEffect(() => {
    if (!userProfile?.householdId || isSyncing) return;

    const timeoutId = setTimeout(async () => {
      try {
        // Use setDoc with merge to ensure it works even if doc was somehow deleted
        await setDoc(doc(db, 'inventory', userProfile.householdId), {
          pantry: inventory.pantry,
          refrigerator: inventory.refrigerator,
          freezer: inventory.freezer,
          customInventory,
          customItemCategories,
          removedStaples,
          manualShoppingList
        }, { merge: true });
        
        await setDoc(doc(db, 'mealPlans', userProfile.householdId), {
          plan: mealPlan
        }, { merge: true });
        
        await setDoc(doc(db, 'favorites', userProfile.householdId), {
          recipes: favorites
        }, { merge: true });
      } catch (err) {
        console.error("Error syncing to Firestore:", err);
      }
    }, 2000); // 2 second debounce to avoid excessive writes

    return () => clearTimeout(timeoutId);
  }, [inventory, customInventory, customItemCategories, removedStaples, manualShoppingList, mealPlan, favorites, userProfile?.householdId]);

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
    localStorage.setItem('mealmaker_planner_mode', plannerMode);
  }, [plannerMode]);

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
    localStorage.setItem('mealmaker_manual_shopping', JSON.stringify(manualShoppingList));
  }, [manualShoppingList]);

  useEffect(() => {
    if (!inputPantryStaple.trim()) return;
    
    const trimmed = inputPantryStaple.trim().toLowerCase();
    const currentCategories = activeInventoryTab === 'pantry' ? PANTRY_CATEGORIES : 
                             activeInventoryTab === 'refrigerator' ? REFRIGERATOR_CATEGORIES : 
                             FREEZER_CATEGORIES;
    
    // 1. Check if it's a known staple (exact match)
    const stapleMatch = Object.keys(STAPLE_CATEGORY_MAP).find(s => s.toLowerCase() === trimmed);
    if (stapleMatch) {
      const cat = STAPLE_CATEGORY_MAP[stapleMatch];
      if ((currentCategories as readonly string[]).includes(cat)) {
        setSelectedCategory(cat);
        return;
      }
    }

    // 2. Check customItemCategories (learned associations - exact match)
    const customMatch = Object.keys(customItemCategories).find(s => s.toLowerCase() === trimmed);
    if (customMatch) {
      const cat = customItemCategories[customMatch];
      if ((currentCategories as readonly string[]).includes(cat)) {
        setSelectedCategory(cat);
        return;
      }
    }

    // 3. Word-based matching from learned associations and staples
    const words = trimmed.split(/\s+/).filter(w => w.length > 2);
    if (words.length > 0) {
      // Check custom associations first as they are user-defined
      for (const word of words) {
        const partialCustomMatch = Object.keys(customItemCategories).find(s => s.toLowerCase().includes(word));
        if (partialCustomMatch) {
          const cat = customItemCategories[partialCustomMatch];
          if ((currentCategories as readonly string[]).includes(cat)) {
            setSelectedCategory(cat);
            return;
          }
        }
      }

      // Then check staples for partial matches
      for (const word of words) {
        const partialStapleMatch = Object.keys(STAPLE_CATEGORY_MAP).find(s => s.toLowerCase().includes(word));
        if (partialStapleMatch) {
          const cat = STAPLE_CATEGORY_MAP[partialStapleMatch];
          if ((currentCategories as readonly string[]).includes(cat)) {
            setSelectedCategory(cat);
            return;
          }
        }
      }
    }

    // 4. Simple keyword matching (hardcoded defaults)
    if (activeInventoryTab === 'refrigerator') {
      if (trimmed.includes('meat') || trimmed.includes('chicken') || trimmed.includes('beef') || trimmed.includes('fish') || trimmed.includes('salmon') || trimmed.includes('pork') || trimmed.includes('shrimp')) {
        setSelectedCategory('Meat Poultry and Seafood');
      } else if (trimmed.includes('milk') || trimmed.includes('egg') || trimmed.includes('cheese') || trimmed.includes('yogurt') || trimmed.includes('butter') || trimmed.includes('cream')) {
        setSelectedCategory('Dairy Products and eggs');
      } else if (trimmed.includes('fruit') || trimmed.includes('vegetable') || trimmed.includes('apple') || trimmed.includes('banana') || trimmed.includes('carrot') || trimmed.includes('onion') || trimmed.includes('garlic') || trimmed.includes('spinach')) {
        setSelectedCategory('Fruits and vegetables');
      } else if (trimmed.includes('drink') || trimmed.includes('juice') || trimmed.includes('soda') || trimmed.includes('water') || trimmed.includes('sauce') || trimmed.includes('ketchup') || trimmed.includes('mustard') || trimmed.includes('mayo')) {
        setSelectedCategory('Condiments and drinks');
      }
    } else if (activeInventoryTab === 'freezer') {
      if (trimmed.includes('meat') || trimmed.includes('chicken') || trimmed.includes('beef') || trimmed.includes('fish') || trimmed.includes('salmon') || trimmed.includes('pork') || trimmed.includes('shrimp')) {
        setSelectedCategory('Meat Poultry and Seafood');
      } else if (trimmed.includes('meal') || trimmed.includes('pizza') || trimmed.includes('dinner') || trimmed.includes('frozen')) {
        setSelectedCategory('Ready Meals');
      } else if (trimmed.includes('fruit') || trimmed.includes('vegetable') || trimmed.includes('berry') || trimmed.includes('peas') || trimmed.includes('corn')) {
        setSelectedCategory('Vegetable and Fruits');
      } else if (trimmed.includes('bread') || trimmed.includes('grain') || trimmed.includes('rice') || trimmed.includes('pasta')) {
        setSelectedCategory('Grains and bread');
      }
    } else {
      // Pantry
      if (trimmed.includes('spice') || trimmed.includes('pepper') || trimmed.includes('salt') || trimmed.includes('powder')) {
        setSelectedCategory('Spices');
      } else if (trimmed.includes('oil') || trimmed.includes('vinegar') || trimmed.includes('honey') || trimmed.includes('syrup')) {
        setSelectedCategory('Oil/vinegar and condiments');
      } else if (trimmed.includes('flour') || trimmed.includes('sugar') || trimmed.includes('baking')) {
        setSelectedCategory('Baking');
      } else if (trimmed.includes('rice') || trimmed.includes('pasta') || trimmed.includes('grain') || trimmed.includes('quinoa')) {
        setSelectedCategory('Grains and starches');
      } else if (trimmed.includes('can') || trimmed.includes('bean') || trimmed.includes('tomato')) {
        setSelectedCategory('Canned goods and proteins');
      } else if (trimmed.includes('snack') || trimmed.includes('breakfast') || trimmed.includes('cereal') || trimmed.includes('chip')) {
        setSelectedCategory('Snack and breakfast');
      } else if (trimmed.includes('drink') || trimmed.includes('beverage') || trimmed.includes('tea') || trimmed.includes('coffee')) {
        setSelectedCategory('Beverages');
      }
    }
  }, [inputPantryStaple, activeInventoryTab, customItemCategories]);

  useEffect(() => {
    localStorage.setItem('mealmaker_removed_staples', JSON.stringify(removedStaples));
  }, [removedStaples]);

  useEffect(() => {
    localStorage.setItem('mealmaker_custom_item_categories', JSON.stringify(customItemCategories));
  }, [customItemCategories]);

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
    if (Object.keys(mealPlan).includes(overId) || (plannerMode === 'month' && overId.startsWith('Week '))) {
      destDay = overId;
    } else if ((DAYS_OF_WEEK as readonly string[]).includes(overId)) {
      destDay = overId;
    } else {
      for (const dayKey of Object.keys(mealPlan)) {
        if (mealPlan[dayKey]?.some(i => i.id === overId)) {
          destDay = dayKey;
          break;
        }
      }
    }

    for (const dayKey of Object.keys(mealPlan)) {
      if (mealPlan[dayKey]?.some(i => i.id === activeId)) {
        sourceDay = dayKey;
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

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
  };

  const addToManualShoppingList = (item: string) => {
    if (!manualShoppingList.includes(item)) {
      setManualShoppingList(prev => [...prev, item]);
      showNotification(lang === 'fr' ? `${item} ajouté au panier` : `${item} added to cart`);
    }
  };

  const removeFromManualShoppingList = (item: string) => {
    setManualShoppingList(prev => prev.filter(i => i !== item));
  };

  const addAllUnselectedToShoppingList = () => {
    const unselected = [
      ...(activeInventoryTab === 'pantry' ? PANTRY_STAPLES : 
        activeInventoryTab === 'refrigerator' ? REFRIGERATOR_STAPLES : 
        FREEZER_STAPLES).filter(s => !removedStaples[activeInventoryTab].includes(s)),
      ...customInventory[activeInventoryTab]
    ].filter(item => !inventory[activeInventoryTab].includes(item));

    if (unselected.length === 0) return;

    setManualShoppingList(prev => {
      const newList = [...prev];
      unselected.forEach(item => {
        if (!newList.includes(item)) {
          newList.push(item);
        }
      });
      return newList;
    });

    showNotification(
      lang === 'fr' 
        ? `${unselected.length} articles ajoutés au panier` 
        : `${unselected.length} items added to cart`
    );
  };

  const addCustomPantryStaple = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = inputPantryStaple.trim();
    if (trimmed) {
      // Check for duplicates
      const existsInInventory = inventory[activeInventoryTab].includes(trimmed);
      const existsInCustom = customInventory[activeInventoryTab].includes(trimmed);
      const isStaple = 
        (activeInventoryTab === 'pantry' && PANTRY_STAPLES.includes(trimmed)) ||
        (activeInventoryTab === 'refrigerator' && REFRIGERATOR_STAPLES.includes(trimmed)) ||
        (activeInventoryTab === 'freezer' && FREEZER_STAPLES.includes(trimmed));

      if (existsInInventory || existsInCustom || isStaple) {
        setInventoryError(t('itemAlreadyInInventory'));
        return;
      }

      setInventoryError(null);
      setCustomItemCategories(prev => ({
        ...prev,
        [trimmed]: selectedCategory
      }));
      setCustomInventory(prev => ({
        ...prev,
        [activeInventoryTab]: [...prev[activeInventoryTab], trimmed]
      }));
      setInventory(prev => ({
        ...prev,
        [activeInventoryTab]: [...prev[activeInventoryTab], trimmed]
      }));
      
      setInputPantryStaple('');
      setSelectedCategory('Others');
    }
  };

  const removeInventoryItem = (item: string, category: InventoryCategory) => {
    const isStaple = 
      (category === 'pantry' && PANTRY_STAPLES.includes(item)) ||
      (category === 'refrigerator' && REFRIGERATOR_STAPLES.includes(item)) ||
      (category === 'freezer' && FREEZER_STAPLES.includes(item));

    if (isStaple) {
      setRemovedStaples(prev => ({
        ...prev,
        [category]: [...prev[category], item]
      }));
    }

    setCustomInventory(prev => ({
      ...prev,
      [category]: prev[category].filter(i => i !== item)
    }));
    setInventory(prev => ({
      ...prev,
      [category]: prev[category].filter(i => i !== item)
    }));
  };

  const getDayKey = (day: string, week: number) => {
    if (plannerMode === 'week') return day;
    return `Week ${week}-${day}`;
  };

  const addToMealPlan = (recipe: Recipe, day: string) => {
    const key = getDayKey(day, currentWeek);
    setMealPlan(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), recipe]
    }));
    setOpenPlannerId(null);
  };

  const addNoteToPlanner = (dayKey?: string) => {
    const targetDayKey = dayKey || getDayKey(DAYS_OF_WEEK[0], currentWeek);
    
    const newNote: Note = {
      id: `note-${Date.now()}`,
      type: 'note',
      text: ''
    };
    
    setMealPlan(prev => ({
      ...prev,
      [targetDayKey]: [...(prev[targetDayKey] || []), newNote]
    }));
    
    // Immediately enter edit mode
    setEditingNote({ id: newNote.id, dayKey: targetDayKey, text: '' });
  };

  const updateNoteDetails = (id: string, dayKey: string, details: string) => {
    setMealPlan(prev => ({
      ...prev,
      [dayKey]: (prev[dayKey] || []).map(item => 
        item.id === id ? { ...item, details } : item
      )
    }));
    if (viewingNoteDetails && viewingNoteDetails.id === id) {
      setViewingNoteDetails({ ...viewingNoteDetails, note: { ...viewingNoteDetails.note, details } });
    }
  };

  const updateNoteInPlanner = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editingNote) return;
    
    if (!editingNote.text.trim()) {
      removeFromMealPlan(editingNote.id, editingNote.dayKey);
    } else {
      setMealPlan(prev => ({
        ...prev,
        [editingNote.dayKey]: (prev[editingNote.dayKey] || []).map(item => 
          item.id === editingNote.id ? { ...item, text: editingNote.text.trim() } : item
        )
      }));
    }
    setEditingNote(null);
  };

  const removeFromMealPlan = (recipeId: string, dayKey: string) => {
    setMealPlan(prev => ({
      ...prev,
      [dayKey]: (prev[dayKey] || []).filter(r => r.id !== recipeId)
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

  const toggleExpandFavorite = (id: string) => {
    setExpandedFavoriteIds(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const filteredFavorites = favorites.filter(recipe => 
    favoriteCategory === 'Any' || recipe.category === favoriteCategory
  );

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
    const recipeIngredients = aggregateMissingIngredients()
      .map(item => `- ${item.amount} ${item.name}`);
    
    const manualItems = manualShoppingList.map(item => `- ${item}`);
    
    const fullList = [...recipeIngredients, ...manualItems].join('\n');
    
    if (fullList) {
      const header = selectedRecipes.length > 0 
        ? `${t('shoppingListFor')} ${selectedRecipes.length} ${t('recipesSelected')}:\n\n`
        : `${t('shoppingListTitle')}:\n\n`;
      
      navigator.clipboard.writeText(`${header}${fullList}`);
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

      For each recipe, assign it to one of these categories: ${MEAL_TYPES.filter(m => m !== 'Any').join(', ')}.
      For each recipe, identify which ingredients are "missing" (not in the priority or secondary lists).
      Ensure the cost per portion is an estimate: $ (budget), $$ (moderate), $$$ (premium).
      Ensure calories and protein are realistic estimates per serving.
      Include appropriate dietary tags (e.g., Vegetarian, Vegan, Gluten-Free, Dairy-Free, Keto, Paleo, Nut-Free, High-Protein, Low-Calorie).
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
                    },
                    category: { type: Type.STRING, description: "One of: Breakfast, Lunch, Dinner, Snack, Dessert" }
                  },
                  required: ["id", "title", "description", "totalTime", "costPerPortion", "caloriesPerPortion", "proteinPerPortion", "servings", "ingredients", "instructions", "category", "dietaryTags"]
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
    <ErrorBoundary>
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans selection:bg-[var(--accent)]">
      {/* Header */}
      <header className="border-b border-[var(--accent)] bg-[var(--bg)]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-[var(--secondary)] p-1 rounded-xl mr-2">
              <button 
                onClick={() => setLang('en')}
                className={cn(
                  "px-2 py-1 text-[10px] font-bold rounded-lg transition-all",
                  lang === 'en' ? "bg-[var(--bg)] text-[var(--primary)] shadow-sm" : "text-[#8E8E8E] hover:text-[var(--primary)]"
                )}
              >
                EN
              </button>
              <button 
                onClick={() => setLang('fr')}
                className={cn(
                  "px-2 py-1 text-[10px] font-bold rounded-lg transition-all",
                  lang === 'fr' ? "bg-[var(--bg)] text-[var(--primary)] shadow-sm" : "text-[#8E8E8E] hover:text-[var(--primary)]"
                )}
              >
                FR
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[var(--primary)] rounded-full flex items-center justify-center text-[var(--bg)]">
                <ChefHat size={24} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-serif font-bold tracking-tight leading-none text-[var(--primary)]">{t('appName')}</h1>
                {t('appSubtitle') && (
                  <span className="text-[10px] text-[#8E8E8E] font-medium uppercase tracking-wider mt-0.5">{t('appSubtitle')}</span>
                )}
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-[var(--primary)]">
            <button 
              onClick={() => setActiveTab('recipes')}
              className={cn("hover:opacity-70 transition-opacity flex items-center gap-2", activeTab === 'recipes' && "text-[var(--primary)] font-bold underline underline-offset-8")}
            >
              {t('recipes')}
            </button>
            <button 
              onClick={() => setActiveTab('pantry')}
              className={cn("hover:opacity-70 transition-opacity flex items-center gap-2", activeTab === 'pantry' && "text-[var(--primary)] font-bold underline underline-offset-8")}
            >
              <Box size={18} />
              {t('kitchenInventory')}
            </button>
            <button 
              onClick={() => setActiveTab('planner')}
              className={cn("hover:opacity-70 transition-opacity flex items-center gap-2", activeTab === 'planner' && "text-[var(--primary)] font-bold underline underline-offset-8")}
            >
              <Calendar size={18} />
              {t('mealPlanner')}
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={cn("hover:opacity-70 transition-opacity flex items-center gap-2", activeTab === 'settings' && "text-[var(--primary)] font-bold underline underline-offset-8")}
            >
              <Settings size={18} />
              {t('settings')}
            </button>
            <button 
              onClick={() => setShowShoppingList(true)}
              className="relative hover:opacity-70 transition-opacity flex items-center gap-2 ml-4"
            >
              <ShoppingCart size={18} />
              {t('shoppingList')}
              {selectedRecipeIds.length > 0 && (
                <span className="absolute -top-2 -right-4 bg-[var(--primary)] text-[var(--bg)] text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {selectedRecipeIds.length}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Navigation Toggle */}
          <div className="flex sm:hidden items-center gap-2">
            <button 
              onClick={() => setShowShoppingList(true)}
              className="relative p-2 text-[var(--primary)] hover:bg-[var(--secondary)] rounded-full transition-colors"
            >
              <ShoppingCart size={20} />
              {selectedRecipeIds.length > 0 && (
                <span className="absolute top-1 right-1 bg-[var(--primary)] text-[var(--bg)] text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  {selectedRecipeIds.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-[var(--primary)] hover:bg-[var(--secondary)] rounded-full transition-colors"
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
              className="sm:hidden bg-[var(--bg)] border-t border-[var(--accent)] overflow-hidden"
            >
              <div className="px-4 py-6 flex flex-col gap-2">
                <button 
                  onClick={() => { setActiveTab('recipes'); setIsMobileMenuOpen(false); }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors",
                    activeTab === 'recipes' ? "bg-[var(--secondary)] text-[var(--primary)]" : "text-[#8E8E8E] hover:bg-[#FDFCFB]"
                  )}
                >
                  <Utensils size={20} />
                  {t('recipes')}
                </button>
                <button 
                  onClick={() => { setActiveTab('pantry'); setIsMobileMenuOpen(false); }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors",
                    activeTab === 'pantry' ? "bg-[var(--secondary)] text-[var(--primary)]" : "text-[#8E8E8E] hover:bg-[#FDFCFB]"
                  )}
                >
                  <Box size={20} />
                  {t('kitchenInventory')}
                </button>
                <button 
                  onClick={() => { setActiveTab('planner'); setIsMobileMenuOpen(false); }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors",
                    activeTab === 'planner' ? "bg-[var(--secondary)] text-[var(--primary)]" : "text-[#8E8E8E] hover:bg-[#FDFCFB]"
                  )}
                >
                  <Calendar size={20} />
                  {t('mealPlanner')}
                </button>
                <button 
                  onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors",
                    activeTab === 'settings' ? "bg-[var(--secondary)] text-[var(--primary)]" : "text-[#8E8E8E] hover:bg-[#FDFCFB]"
                  )}
                >
                  <Settings size={20} />
                  {t('settings')}
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
              <div className="flex gap-8 border-b border-[var(--accent)]">
                <button 
                  onClick={() => setRecipeSubTab('search')}
                  className={cn(
                    "pb-4 text-sm font-bold uppercase tracking-widest transition-all relative",
                    recipeSubTab === 'search' ? "text-[var(--primary)]" : "text-[#8E8E8E] hover:text-[var(--primary)]"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Search size={16} />
                    {t('search')}
                  </div>
                  {recipeSubTab === 'search' && (
                    <motion.div layoutId="recipeSubTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
                  )}
                </button>
                <button 
                  onClick={() => setRecipeSubTab('favorites')}
                  className={cn(
                    "pb-4 text-sm font-bold uppercase tracking-widest transition-all relative",
                    recipeSubTab === 'favorites' ? "text-[var(--primary)]" : "text-[#8E8E8E] hover:text-[var(--primary)]"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Heart size={16} className={cn(recipeSubTab === 'favorites' && "fill-current")} />
                    {t('favorites')}
                  </div>
                  {recipeSubTab === 'favorites' && (
                    <motion.div layoutId="recipeSubTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
                  )}
                </button>
              </div>

              {recipeSubTab === 'search' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  {/* Left Column: Inputs */}
                  <div className="lg:col-span-4 space-y-8">
                <section className="bg-[var(--bg)] p-6 rounded-[32px] shadow-sm border border-[var(--accent)]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-serif font-semibold flex items-center gap-2">
                      <Search size={18} className="text-[var(--primary)]" />
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
                      className="w-full pl-4 pr-12 py-3 bg-[var(--secondary)] rounded-2xl border-none focus:ring-2 focus:ring-[var(--primary)] transition-all text-sm"
                    />
                    <button 
                      type="submit"
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-[var(--primary)] text-[var(--bg)] rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
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
                          className="px-2.5 py-1 bg-[var(--accent)] text-[var(--primary)] rounded-full text-[11px] font-medium flex items-center gap-1.5 group"
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
                                ? "bg-[var(--primary)] text-[var(--bg)] border-[var(--primary)]" 
                                : "bg-[var(--bg)] text-[var(--primary)] border-[#E6E0D4] hover:border-[var(--primary)]"
                            )}
                          >
                            {t(`mealTypes.${type}`)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[#8E8E8E] mb-3">{t('servingsLabel')}</h3>
                      <div className="flex items-center gap-4 bg-[var(--secondary)] p-2 rounded-2xl border border-[var(--accent)]">
                        <button 
                          onClick={() => setServings(Math.max(1, servings - 1))}
                          className="w-8 h-8 bg-[var(--secondary)] rounded-xl flex items-center justify-center text-[var(--primary)] shadow-sm hover:opacity-80 transition-colors"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="flex-1 text-center font-bold text-[var(--primary)]">{servings}</span>
                        <button 
                          onClick={() => setServings(Math.min(12, servings + 1))}
                          className="w-8 h-8 bg-[var(--secondary)] rounded-xl flex items-center justify-center text-[var(--primary)] shadow-sm hover:opacity-80 transition-colors"
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
                                ? "bg-[var(--primary)] text-[var(--bg)] border-[var(--primary)]" 
                                : "bg-[var(--bg)] text-[var(--primary)] border-[#E6E0D4] hover:border-[var(--primary)]"
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
                          className="w-full pl-4 pr-12 py-2.5 bg-[var(--secondary)] rounded-xl border-none focus:ring-2 focus:ring-[var(--primary)] transition-all text-xs"
                        />
                        <button 
                          type="submit"
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-[var(--accent)] text-[var(--primary)] rounded-lg flex items-center justify-center hover:bg-[#D6D0C4] transition-colors"
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
                        className="w-full px-4 py-3 bg-[var(--secondary)] rounded-2xl border-none focus:ring-2 focus:ring-[var(--primary)] text-sm appearance-none cursor-pointer"
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
                    className="w-full mt-8 py-4 bg-[var(--primary)] text-[var(--bg)] rounded-2xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--primary)]/20"
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
                        className="text-[10px] font-bold uppercase tracking-wider bg-[var(--bg)] border border-red-200 text-red-600 px-3 py-1.5 rounded-lg self-start hover:bg-red-50 transition-colors"
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
                              className="bg-[var(--bg)] rounded-[32px] overflow-hidden border border-[var(--accent)] shadow-sm hover:shadow-md transition-shadow"
                            >
                              <div className="p-8">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                                  <div>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                      {recipe.dietaryTags?.map(tag => (
                                        <span key={tag} className="px-2 py-1 bg-[var(--secondary)] text-[var(--primary)] rounded-md text-[10px] font-bold uppercase tracking-wider">
                                          {tag}
                                        </span>
                                      ))}
                                      <span className="px-2 py-1 bg-[var(--secondary)] text-[var(--primary)] rounded-md text-[10px] font-bold uppercase tracking-wider">
                                        {recipe.cuisine}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 mb-2">
                                      <h3 className="text-2xl font-serif font-bold">{recipe.title}</h3>
                                      <button 
                                        onClick={() => toggleFavorite(recipe)}
                                        className={cn(
                                          "p-2 rounded-full transition-all",
                                          isFavorite(recipe.id) ? "text-red-500 bg-red-50" : "text-[#8E8E8E] hover:bg-[var(--secondary)]"
                                        )}
                                        title={isFavorite(recipe.id) ? t('removeFromFavorites') : t('addToFavorites')}
                                      >
                                        <Heart size={20} className={cn(isFavorite(recipe.id) && "fill-current")} />
                                      </button>
                                    </div>
                                    <p className="text-[var(--primary)] text-sm leading-relaxed max-w-2xl">{recipe.description}</p>
                                    
                                    <div className="flex flex-wrap gap-3 mt-4">
                                      <button 
                                        onClick={() => toggleRecipeSelection(recipe.id)}
                                        className={cn(
                                          "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2",
                                          selectedRecipeIds.includes(recipe.id)
                                            ? "bg-[var(--primary)] text-[var(--bg)]"
                                            : "bg-[var(--secondary)] text-[var(--primary)] hover:bg-[var(--accent)]"
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
                                          className="px-4 py-2 bg-[var(--secondary)] text-[var(--primary)] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[var(--accent)] transition-all flex items-center gap-2"
                                        >
                                          <Calendar size={14} />
                                          {t('saveToPlanner')}
                                        </button>
                                        {/* Dropdown with bridge to prevent disappearing */}
                                        <div className={cn(
                                          "absolute top-full left-0 pt-1 z-10 min-w-[150px]",
                                          openPlannerId === recipe.id ? "block" : "hidden lg:group-hover/planner:block"
                                        )}>
                                          <div className="bg-[var(--bg)] border border-[var(--accent)] rounded-xl shadow-xl p-2">
                                            {plannerMode === 'month' && (
                                              <div className="flex border-b border-[var(--accent)] mb-2 pb-2 gap-1">
                                                {[1, 2, 3, 4].map(w => (
                                                  <button 
                                                    key={w}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setCurrentWeek(w);
                                                    }}
                                                    className={cn(
                                                      "flex-1 h-6 flex items-center justify-center text-[9px] font-bold rounded-md transition-all",
                                                      currentWeek === w ? "bg-[var(--primary)] text-[var(--bg)]" : "bg-[var(--secondary)] text-[#8E8E8E]"
                                                    )}
                                                  >
                                                    W{w}
                                                  </button>
                                                ))}
                                              </div>
                                            )}
                                            {DAYS_OF_WEEK.map(day => (
                                              <button 
                                                key={day}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  addToMealPlan(recipe, day);
                                                }}
                                                className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--secondary)] rounded-lg transition-colors"
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
                                    <div className="flex items-center gap-1.5 text-[var(--primary)]">
                                      <Clock size={16} />
                                      <span className="text-sm font-semibold">{recipe.totalTime}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[var(--primary)]">
                                      <Users size={16} />
                                      <span className="text-sm font-semibold">{recipe.servings} {t('servings')}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[var(--primary)]">
                                      <DollarSign size={16} />
                                      <span className="text-sm font-semibold">{recipe.costPerPortion}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[var(--primary)]">
                                      <Flame size={16} />
                                      <span className="text-sm font-semibold">{recipe.caloriesPerPortion} {t('calories')}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[var(--primary)]">
                                      <Dumbbell size={16} />
                                      <span className="text-sm font-semibold">{recipe.proteinPerPortion} {t('protein')}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-[var(--secondary)]">
                                  <div>
                                    <div className="flex items-center justify-between mb-4">
                                      <h4 className="text-xs font-bold uppercase tracking-widest text-[#8E8E8E]">{t('ingredients')}</h4>
                                      <button 
                                        onClick={() => copyMissingIngredients(recipe)}
                                        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--primary)] hover:opacity-70 transition-opacity"
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
                                            ing.isMissing ? "text-[#8E8E8E]" : "text-[var(--text)]"
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
                                          <span className="font-serif italic text-[var(--primary)] opacity-30 text-lg leading-none">{i + 1}</span>
                                          <p className="leading-relaxed text-[var(--text)]">{step}</p>
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
                            className="px-8 py-4 bg-[var(--bg)] border border-[var(--accent)] text-[var(--primary)] rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-[var(--secondary)] transition-all disabled:opacity-50 shadow-sm"
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
                        className="h-[60vh] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-[var(--accent)] rounded-[48px]"
                      >
                        <div className="w-20 h-20 bg-[var(--secondary)] rounded-full flex items-center justify-center text-[var(--primary)] mb-6">
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
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
                <div>
                  <h2 className="text-2xl font-serif font-bold">{t('favorites')}</h2>
                  <span className="text-sm text-[#8E8E8E]">{favorites.length} {lang === 'fr' ? 'recettes enregistrées' : 'recipes saved'}</span>
                </div>
                
                <div className="flex bg-[var(--secondary)] p-1 rounded-2xl sm:rounded-full flex-wrap sm:flex-nowrap gap-1 justify-center sm:justify-start">
                  {MEAL_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setFavoriteCategory(type)}
                      className={cn(
                        "px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0",
                        favoriteCategory === type 
                          ? "bg-[var(--bg)] text-[var(--primary)] shadow-sm" 
                          : "text-[#8E8E8E] hover:text-[var(--primary)]"
                      )}
                    >
                      {t(`mealTypes.${type}`)}
                    </button>
                  ))}
                </div>
              </div>
              
              {filteredFavorites.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {filteredFavorites.map((recipe, idx) => (
                    <motion.div 
                      key={recipe.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-[var(--bg)] rounded-3xl overflow-hidden border border-[var(--accent)] shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between gap-4">
                          <div 
                            className="flex-1 cursor-pointer group"
                            onClick={() => toggleExpandFavorite(recipe.id)}
                          >
                            <h3 className="text-lg font-serif font-bold group-hover:text-[var(--primary)] transition-colors">{recipe.title}</h3>
                          </div>

                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => toggleFavorite(recipe)}
                              className={cn(
                                "p-2 rounded-full transition-all",
                                isFavorite(recipe.id) ? "text-red-500 bg-red-50" : "text-[#8E8E8E] hover:bg-[var(--secondary)]"
                              )}
                              title={isFavorite(recipe.id) ? t('removeFromFavorites') : t('addToFavorites')}
                            >
                              <Heart size={18} className={cn(isFavorite(recipe.id) && "fill-current")} />
                            </button>
                            <button 
                              onClick={() => toggleExpandFavorite(recipe.id)}
                              className="p-2 text-[var(--primary)] hover:bg-[var(--secondary)] rounded-full transition-colors"
                            >
                              <motion.div
                                animate={{ rotate: expandedFavoriteIds.includes(recipe.id) ? 180 : 0 }}
                              >
                                <ChevronRight size={20} className="rotate-90" />
                              </motion.div>
                            </button>
                          </div>
                        </div>

                        <AnimatePresence>
                          {expandedFavoriteIds.includes(recipe.id) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="pt-6 mt-6 border-t border-[var(--secondary)]">
                                <div className="flex flex-wrap items-center gap-4 mb-6 text-[#8E8E8E] text-[10px] font-bold uppercase tracking-wider">
                                  <span className="px-2 py-0.5 bg-[var(--secondary)] text-[var(--primary)] rounded">
                                    {recipe.category ? t(`mealTypes.${recipe.category}`) : t('mealTypes.Any')}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <Clock size={12} />
                                    {recipe.totalTime}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Users size={12} />
                                    {recipe.servings}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <DollarSign size={12} />
                                    {recipe.costPerPortion}
                                  </div>
                                </div>

                                <p className="text-[var(--primary)] text-sm leading-relaxed mb-6">{recipe.description}</p>
                                
                                <div className="flex flex-wrap gap-3 mb-8">
                                  <button 
                                    onClick={() => toggleRecipeSelection(recipe.id)}
                                    className={cn(
                                      "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2",
                                      selectedRecipeIds.includes(recipe.id)
                                        ? "bg-[var(--primary)] text-[var(--bg)]"
                                        : "bg-[var(--secondary)] text-[var(--primary)] hover:bg-[var(--accent)]"
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
                                      className="px-4 py-2 bg-[var(--secondary)] text-[var(--primary)] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[var(--accent)] transition-all flex items-center gap-2"
                                    >
                                      <Calendar size={14} />
                                      {t('saveToPlanner')}
                                    </button>
                                    <div className={cn(
                                      "absolute top-full left-0 pt-1 z-10 min-w-[150px]",
                                      openPlannerId === recipe.id ? "block" : "hidden lg:group-hover/planner:block"
                                    )}>
                                      <div className="bg-[var(--bg)] border border-[var(--accent)] rounded-xl shadow-xl p-2">
                                        {plannerMode === 'month' && (
                                          <div className="flex border-b border-[var(--accent)] mb-2 pb-2 gap-1">
                                            {[1, 2, 3, 4].map(w => (
                                              <button 
                                                key={w}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setCurrentWeek(w);
                                                }}
                                                className={cn(
                                                  "flex-1 h-6 flex items-center justify-center text-[9px] font-bold rounded-md transition-all",
                                                  currentWeek === w ? "bg-[var(--primary)] text-[var(--bg)]" : "bg-[var(--secondary)] text-[#8E8E8E]"
                                                )}
                                              >
                                                W{w}
                                              </button>
                                            ))}
                                          </div>
                                        )}
                                        {DAYS_OF_WEEK.map(day => (
                                          <button 
                                            key={day}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              addToMealPlan(recipe, day);
                                            }}
                                            className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--secondary)] rounded-lg transition-colors"
                                          >
                                            {t(`days.${day}`)}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-[var(--secondary)]">
                                  <div>
                                    <div className="flex items-center justify-between mb-4">
                                      <h4 className="text-xs font-bold uppercase tracking-widest text-[#8E8E8E]">{t('ingredients')}</h4>
                                      <button 
                                        onClick={() => copyMissingIngredients(recipe)}
                                        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--primary)] hover:opacity-70 transition-opacity"
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
                                            ing.isMissing ? "text-[#8E8E8E]" : "text-[var(--text)]"
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
                                          <span className="font-serif italic text-[var(--primary)] opacity-30 text-lg leading-none">{i + 1}</span>
                                          <p className="leading-relaxed text-[var(--text)]">{step}</p>
                                        </li>
                                      ))}
                                    </ol>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="h-[40vh] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-[var(--accent)] rounded-[48px]">
                  <div className="w-16 h-16 bg-[var(--secondary)] rounded-full flex items-center justify-center text-[var(--primary)] mb-4">
                    <Heart size={24} />
                  </div>
                  <p className="text-[#8E8E8E] max-w-xs mx-auto leading-relaxed">
                    {favoriteCategory === 'Any' ? t('noFavorites') : (lang === 'fr' ? `Aucun favori dans la catégorie ${t(`mealTypes.${favoriteCategory}`)}.` : `No favorites in the ${t(`mealTypes.${favoriteCategory}`)} category.`)}
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
              <div className="bg-[var(--bg)] p-5 sm:p-8 rounded-[32px] sm:rounded-[48px] border border-[var(--accent)] shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[var(--secondary)] rounded-full flex items-center justify-center text-[var(--primary)]">
                      <Box size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-serif font-bold">{t('kitchenInventory')}</h2>
                      <p className="text-[#8E8E8E] text-sm">{lang === 'fr' ? 'Gérez votre stock dans le garde-manger, le frigo et le congélateur.' : 'Manage your stock across pantry, fridge, and freezer.'}</p>
                    </div>
                  </div>

                  <div className="flex bg-[var(--secondary)] p-1 rounded-full w-full lg:w-auto lg:min-w-[400px]">
                    {(['pantry', 'refrigerator', 'freezer'] as InventoryCategory[]).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveInventoryTab(tab)}
                        className={cn(
                          "flex-1 px-2 sm:px-4 py-2 rounded-full text-[9px] sm:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap text-center",
                          activeInventoryTab === tab 
                            ? "bg-[var(--bg)] text-[var(--primary)] shadow-sm" 
                            : "text-[#8E8E8E] hover:text-[var(--primary)]"
                        )}
                      >
                        {t(tab)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const newExpanded: Record<string, boolean> = {};
                        const currentCategories = activeInventoryTab === 'pantry' ? PANTRY_CATEGORIES : 
                                                 activeInventoryTab === 'refrigerator' ? REFRIGERATOR_CATEGORIES : 
                                                 FREEZER_CATEGORIES;
                        currentCategories.forEach(cat => newExpanded[cat] = true);
                        setExpandedCategories(prev => ({ ...prev, ...newExpanded }));
                      }}
                      className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary)] hover:underline"
                    >
                      {lang === 'fr' ? 'Tout développer' : 'Expand All'}
                    </button>
                    <span className="text-[var(--accent)]">|</span>
                    <button
                      onClick={() => {
                        const newExpanded: Record<string, boolean> = {};
                        const currentCategories = activeInventoryTab === 'pantry' ? PANTRY_CATEGORIES : 
                                                 activeInventoryTab === 'refrigerator' ? REFRIGERATOR_CATEGORIES : 
                                                 FREEZER_CATEGORIES;
                        currentCategories.forEach(cat => newExpanded[cat] = false);
                        setExpandedCategories(prev => ({ ...prev, ...newExpanded }));
                      }}
                      className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary)] hover:underline"
                    >
                      {lang === 'fr' ? 'Tout réduire' : 'Close All'}
                    </button>
                  </div>
                  <button
                    onClick={addAllUnselectedToShoppingList}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--primary)] hover:opacity-70 transition-opacity bg-[var(--secondary)] px-4 py-2 rounded-full"
                  >
                    <ShoppingCart size={14} />
                    {lang === 'fr' ? 'Ajouter tout le manquant à la liste' : 'Add all unselected to list'}
                  </button>
                </div>

                <div className="space-y-6 mb-12">
                  {(activeInventoryTab === 'pantry' ? PANTRY_CATEGORIES : 
                    activeInventoryTab === 'refrigerator' ? REFRIGERATOR_CATEGORIES : 
                    FREEZER_CATEGORIES).map(category => {
                    const allItems = [
                      ...(activeInventoryTab === 'pantry' ? PANTRY_STAPLES : 
                        activeInventoryTab === 'refrigerator' ? REFRIGERATOR_STAPLES : 
                        FREEZER_STAPLES).filter(s => !removedStaples[activeInventoryTab].includes(s)),
                      ...customInventory[activeInventoryTab]
                    ];
                    
                    const itemsInCategory = allItems.filter(item => {
                      const itemCat = STAPLE_CATEGORY_MAP[item] || customItemCategories[item] || 'Others';
                      return itemCat === category;
                    });

                    if (itemsInCategory.length === 0) return null;

                    return (
                      <div key={category} className="space-y-3">
                        <button 
                          onClick={() => setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }))}
                          className="flex items-center gap-2 w-full text-left group"
                        >
                          <div className="flex items-center gap-2 px-3 py-1 bg-[var(--secondary)] rounded-full">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8E8E8E]">{t(`categories.${category}`)}</span>
                            <ChevronDown 
                              size={12} 
                              className={cn(
                                "text-[#8E8E8E] transition-transform",
                                !expandedCategories[category] && "-rotate-90"
                              )} 
                            />
                          </div>
                          <div className="flex-1 h-[1px] bg-[var(--secondary)]" />
                        </button>

                        <AnimatePresence>
                          {expandedCategories[category] && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 py-2">
                                {itemsInCategory.map(item => (
                                  <div
                                    key={item}
                                    className={cn(
                                      "px-3 py-2 rounded-full border text-[11px] font-medium transition-all flex items-center justify-between group",
                                      inventory[activeInventoryTab].includes(item)
                                        ? "bg-[var(--primary)] text-[var(--bg)] border-[var(--primary)]"
                                        : "bg-[var(--bg)] text-[var(--primary)] border-[var(--accent)] hover:border-[var(--primary)]"
                                    )}
                                  >
                                    <button 
                                      onClick={() => togglePantryStaple(item)}
                                      className="flex-1 text-left truncate pr-1"
                                    >
                                      {PANTRY_STAPLES.includes(item) || REFRIGERATOR_STAPLES.includes(item) || FREEZER_STAPLES.includes(item) ? t(`staples.${item}`) : item}
                                    </button>
                                    <div className="flex items-center gap-1 shrink-0">
                                      {inventory[activeInventoryTab].includes(item) ? (
                                        <Check size={12} />
                                      ) : (
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            addToManualShoppingList(item);
                                          }}
                                          className="p-1 hover:bg-black/5 rounded-full transition-colors"
                                          title={lang === 'fr' ? 'Ajouter à la liste de courses' : 'Add to shopping list'}
                                        >
                                          <ShoppingCart size={12} />
                                        </button>
                                      )}
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeInventoryItem(item, activeInventoryTab);
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
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>

                <div className="mb-12">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#8E8E8E] mb-4">
                    {t('addTo')} {t(activeInventoryTab)}
                  </h3>
                  <form onSubmit={addCustomPantryStaple} className="flex flex-col gap-3 max-w-md">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <input 
                          type="text"
                          list="ingredients-suggestions"
                          value={inputPantryStaple}
                          onChange={(e) => {
                            setInputPantryStaple(e.target.value);
                            if (inventoryError) setInventoryError(null);
                          }}
                          placeholder={`e.g. ${activeInventoryTab === 'freezer' ? (lang === 'fr' ? 'Petits pois' : 'Frozen Peas') : activeInventoryTab === 'refrigerator' ? (lang === 'fr' ? 'Yaourt grec' : 'Greek Yogurt') : (lang === 'fr' ? 'Miel' : 'Honey')}`}
                          className="w-full px-4 py-3 bg-[var(--secondary)] rounded-2xl border-none focus:ring-2 focus:ring-[var(--primary)] text-sm"
                        />
                        <datalist id="ingredients-suggestions">
                          {COMMON_INGREDIENTS.map(ing => (
                            <option key={ing} value={ing} />
                          ))}
                        </datalist>
                      </div>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as ItemCategory)}
                        className="px-4 py-3 bg-[var(--secondary)] rounded-2xl border-none focus:ring-2 focus:ring-[var(--primary)] text-sm appearance-none cursor-pointer"
                      >
                        {(activeInventoryTab === 'pantry' ? PANTRY_CATEGORIES : 
                          activeInventoryTab === 'refrigerator' ? REFRIGERATOR_CATEGORIES : 
                          FREEZER_CATEGORIES).map(cat => (
                          <option key={cat} value={cat}>{t(`categories.${cat}`)}</option>
                        ))}
                      </select>
                    </div>
                    {inventoryError && (
                      <p className="text-red-500 text-xs font-medium ml-1">{inventoryError}</p>
                    )}
                    <button 
                      type="submit"
                      className="w-full sm:w-auto px-6 py-3 bg-[var(--primary)] text-[var(--bg)] rounded-2xl font-semibold hover:opacity-90 transition-colors"
                    >
                      {t('add')}
                    </button>
                  </form>
                </div>

                <div className="mt-12 p-6 bg-[var(--secondary)] rounded-3xl">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-[#8E8E8E] mb-4">{lang === 'fr' ? 'Gestion de l\'inventaire' : 'Inventory Management'}</h3>
                  <p className="text-sm text-[var(--primary)] leading-relaxed">
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
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[var(--secondary)] rounded-full flex items-center justify-center text-[var(--primary)]">
                        <Calendar size={24} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-serif font-bold">
                          {plannerMode === 'week' ? t('weeklyPlanner') : t('monthlyPlanner')}
                        </h2>
                        {plannerMode === 'month' && (
                          <p className="text-[#8E8E8E] text-xs font-bold uppercase tracking-widest mt-1">
                            {t('week')} {currentWeek}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex bg-[var(--secondary)] p-1 rounded-xl border border-[var(--accent)]">
                        <button 
                          onClick={() => setPlannerMode('week')}
                          className={cn(
                            "px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all",
                            plannerMode === 'week' ? "bg-[var(--bg)] text-[var(--primary)] shadow-sm" : "text-[#8E8E8E] hover:text-[var(--primary)]"
                          )}
                        >
                          {t('week')}
                        </button>
                        <button 
                          onClick={() => setPlannerMode('month')}
                          className={cn(
                            "px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all",
                            plannerMode === 'month' ? "bg-[var(--bg)] text-[var(--primary)] shadow-sm" : "text-[#8E8E8E] hover:text-[var(--primary)]"
                          )}
                        >
                          {t('month')}
                        </button>
                      </div>

                      {plannerMode === 'month' && (
                        <div className="flex bg-[var(--secondary)] p-1 rounded-xl border border-[var(--accent)]">
                          {[1, 2, 3, 4].map(w => (
                            <button 
                              key={w}
                              onClick={() => setCurrentWeek(w)}
                              className={cn(
                                "w-8 h-8 flex items-center justify-center text-[10px] font-bold rounded-lg transition-all",
                                currentWeek === w ? "bg-[var(--bg)] text-[var(--primary)] shadow-sm" : "text-[#8E8E8E] hover:text-[var(--primary)]"
                              )}
                            >
                              {w}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => {
                            if (plannerMode === 'week') {
                              setMealPlan({});
                            } else {
                              setMealPlan(prev => {
                                const next = { ...prev };
                                DAYS_OF_WEEK.forEach(day => {
                                  delete next[getDayKey(day, currentWeek)];
                                });
                                return next;
                              });
                            }
                          }}
                          className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:opacity-70 transition-opacity"
                        >
                          {plannerMode === 'week' ? t('clearAll') : t('clearWeek')}
                        </button>
                        {plannerMode === 'month' && (
                          <button 
                            onClick={() => setMealPlan({})}
                            className="text-[10px] font-bold uppercase tracking-widest text-red-700 hover:opacity-70 transition-opacity"
                          >
                            {t('clearAll')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                </div>

              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                  {DAYS_OF_WEEK.map(day => {
                    const dayKey = getDayKey(day, currentWeek);
                    return (
                      <DroppableDay 
                        key={dayKey} 
                        day={t(`days.${day}`)} 
                        dayKey={dayKey}
                        items={mealPlan[dayKey] || []} 
                        onRecipeClick={setViewingPlannerRecipe}
                        onRemove={removeFromMealPlan}
                        isFavorite={isFavorite}
                        onToggleFavorite={toggleFavorite}
                        onEditNote={(id, dayKey, text) => setEditingNote({ id, dayKey, text })}
                        editingNote={editingNote}
                        onUpdateNote={updateNoteInPlanner}
                        onCancelEdit={() => setEditingNote(null)}
                        onAddNote={addNoteToPlanner}
                        onViewDetails={(id, dayKey, note) => setViewingNoteDetails({ id, dayKey, note })}
                      />
                    );
                  })}
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
                      "p-3 rounded-2xl shadow-2xl border-2 border-[var(--primary)] scale-105 rotate-2",
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
          {activeTab === 'settings' && (
            <motion.div 
              key="settings-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-[var(--bg)] p-8 rounded-[48px] border border-[var(--accent)] shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-[var(--secondary)] rounded-full flex items-center justify-center text-[var(--primary)]">
                    <Settings size={24} />
                  </div>
                  <h2 className="text-2xl font-serif font-bold">{t('settings')}</h2>
                </div>

                <div className="space-y-8">
                  <section className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[var(--secondary)] rounded-full flex items-center justify-center text-[var(--primary)]">
                        <Users size={20} />
                      </div>
                      <h3 className="text-lg font-serif font-bold">{t('household')}</h3>
                    </div>

                    {!user ? (
                      <div className="bg-[var(--secondary)] p-8 rounded-[32px] text-center space-y-4">
                        <p className="text-sm text-[#8E8E8E] leading-relaxed">
                          {t('householdDescription')}
                        </p>
                        <button 
                          onClick={handleLogin}
                          disabled={isLoggingIn}
                          className="px-8 py-3 bg-[var(--primary)] text-[var(--bg)] rounded-2xl font-semibold hover:opacity-90 transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
                        >
                          <Users size={18} />
                          {isLoggingIn ? (lang === 'fr' ? 'Connexion...' : 'Signing in...') : t('signInWithGoogle')}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-[var(--secondary)] rounded-2xl">
                          <div className="flex items-center gap-3">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-10 h-10 bg-[var(--accent)] rounded-full flex items-center justify-center text-[var(--primary)]">
                                <Users size={20} />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-bold">{user.displayName}</p>
                              <p className="text-xs text-[#8E8E8E]">{user.email}</p>
                            </div>
                          </div>
                          <button 
                            onClick={handleLogout}
                            disabled={isLoggingIn}
                            className="text-xs font-bold text-red-500 hover:opacity-70 transition-opacity disabled:opacity-50"
                          >
                            {t('signOut')}
                          </button>
                        </div>

                        {!userProfile?.householdId ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-[var(--secondary)] p-6 rounded-3xl space-y-4">
                              <h4 className="text-sm font-bold uppercase tracking-widest text-[#8E8E8E]">{t('createHousehold')}</h4>
                              <input 
                                type="text"
                                value={householdNameInput}
                                onChange={(e) => setHouseholdNameInput(e.target.value)}
                                placeholder={t('householdName')}
                                className="w-full px-4 py-3 bg-[var(--bg)] rounded-xl border border-[var(--accent)] text-sm focus:ring-2 focus:ring-[var(--primary)] outline-none"
                              />
                              <button 
                                onClick={createHousehold}
                                disabled={!householdNameInput || isProcessingHousehold}
                                className="w-full py-3 bg-[var(--primary)] text-[var(--bg)] rounded-xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {isProcessingHousehold ? (
                                  <RefreshCw size={16} className="animate-spin" />
                                ) : t('create')}
                              </button>
                            </div>

                            <div className="bg-[var(--secondary)] p-6 rounded-3xl space-y-4">
                              <h4 className="text-sm font-bold uppercase tracking-widest text-[#8E8E8E]">{t('joinHousehold')}</h4>
                              <input 
                                type="text"
                                value={inviteCodeInput}
                                onChange={(e) => setInviteCodeInput(e.target.value)}
                                placeholder={t('enterInviteCode')}
                                className="w-full px-4 py-3 bg-[var(--bg)] rounded-xl border border-[var(--accent)] text-sm focus:ring-2 focus:ring-[var(--primary)] outline-none uppercase"
                              />
                              <button 
                                onClick={joinHousehold}
                                disabled={!inviteCodeInput || isProcessingHousehold}
                                className="w-full py-3 bg-[var(--primary)] text-[var(--bg)] rounded-xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {isProcessingHousehold ? (
                                  <RefreshCw size={16} className="animate-spin" />
                                ) : t('join')}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-[var(--secondary)] p-6 rounded-3xl space-y-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-bold uppercase tracking-widest text-[#8E8E8E] mb-1">{t('household')}</h4>
                                <p className="text-xl font-serif font-bold">{household?.name}</p>
                              </div>
                              <button 
                                onClick={leaveHousehold}
                                className="px-4 py-2 bg-red-50 text-red-500 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors"
                              >
                                {t('leaveHousehold')}
                              </button>
                            </div>

                            <div className="p-4 bg-[var(--bg)] rounded-2xl border border-[var(--accent)] flex items-center justify-between">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[#8E8E8E] mb-1">{t('inviteCode')}</p>
                                <p className="text-lg font-mono font-bold tracking-wider">{household?.inviteCode}</p>
                              </div>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(household?.inviteCode || '');
                                  setNotification({ message: t('inviteCodeCopied'), type: 'success' });
                                }}
                                className="p-2 bg-[var(--secondary)] rounded-xl text-[var(--primary)] hover:bg-[var(--accent)] transition-colors"
                              >
                                <Copy size={18} />
                              </button>
                            </div>

                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8E8E8E] mb-3">{t('householdMembers')}</p>
                              <div className="flex flex-wrap gap-2">
                                {household?.members?.map((memberId: string) => (
                                  <div key={memberId} className="w-8 h-8 bg-[var(--accent)] rounded-full flex items-center justify-center text-[var(--primary)] text-[10px] font-bold border border-white/20">
                                    {memberId.substring(0, 2).toUpperCase()}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </section>

                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-[#8E8E8E] mb-6 flex items-center gap-2">
                      <Box size={18} />
                      {t('colorSchemes')}
                    </h3>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                      {COLOR_SCHEMES.map((scheme) => (
                        <button
                          key={scheme.id}
                          onClick={() => setThemeColors(scheme)}
                          className={cn(
                            "group relative flex flex-col items-center gap-2 p-2 rounded-2xl border-2 transition-all",
                            themeColors.primary === scheme.primary && themeColors.bg === scheme.bg
                              ? "border-[var(--primary)] bg-[var(--secondary)]"
                              : "border-[var(--accent)] hover:border-[var(--primary)]"
                          )}
                        >
                          <div className="w-full aspect-square rounded-xl overflow-hidden shadow-sm border border-black/5 flex flex-col">
                            <div className="flex-1" style={{ backgroundColor: scheme.bg }}>
                              <div className="p-1">
                                <div className="w-1/2 h-1 rounded-full" style={{ backgroundColor: scheme.primary }} />
                              </div>
                            </div>
                            <div className="h-1/3 flex">
                              <div className="flex-1" style={{ backgroundColor: scheme.secondary }} />
                              <div className="flex-1" style={{ backgroundColor: scheme.accent }} />
                            </div>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary)]">
                            {t(`schemes.${scheme.id}`)}
                          </span>
                          {themeColors.primary === scheme.primary && themeColors.bg === scheme.bg && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--primary)] text-[var(--bg)] rounded-full flex items-center justify-center shadow-sm">
                              <Check size={12} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Note Details Modal */}
      <AnimatePresence>
        {viewingNoteDetails && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingNoteDetails(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-4 md:inset-20 bg-[var(--bg)] z-[110] rounded-[48px] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 md:p-10 border-b border-[var(--secondary)] flex items-center justify-between bg-[var(--bg)] sticky top-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-500">
                    <Box size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-serif font-bold">
                      {viewingNoteDetails.note.text || (lang === 'fr' ? 'Note sans titre' : 'Untitled Note')}
                    </h2>
                    <p className="text-[#8E8E8E] text-xs font-bold uppercase tracking-widest mt-1">
                      {t(`days.${viewingNoteDetails.dayKey.split('-')[0]}`)}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingNoteDetails(null)}
                  className="w-10 h-10 bg-[var(--secondary)] rounded-full flex items-center justify-center text-[var(--primary)] hover:bg-[var(--accent)] transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 md:p-10">
                <div className="max-w-3xl mx-auto space-y-8">
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-[#8E8E8E] mb-4">
                      {lang === 'fr' ? 'Détails de la note' : 'Note Details'}
                    </h3>
                    <textarea 
                      value={viewingNoteDetails.note.details || ''}
                      onChange={(e) => updateNoteDetails(viewingNoteDetails.id, viewingNoteDetails.dayKey, e.target.value)}
                      placeholder={lang === 'fr' ? 'Entrez des détails, une recette personnelle ou un lien...' : 'Enter details, a personal recipe, or a link...'}
                      className="w-full h-64 bg-[var(--secondary)] border border-[var(--accent)] rounded-3xl p-6 text-sm focus:ring-2 focus:ring-[var(--primary)] outline-none resize-none leading-relaxed"
                    />
                  </section>

                  <section className="p-6 bg-orange-50 rounded-3xl border border-orange-100">
                    <div className="flex items-center gap-3 text-orange-700 mb-2">
                      <AlertCircle size={18} />
                      <h4 className="font-bold text-sm">{lang === 'fr' ? 'Astuce' : 'Pro Tip'}</h4>
                    </div>
                    <p className="text-xs text-orange-600 leading-relaxed">
                      {lang === 'fr' 
                        ? "Utilisez cet espace pour noter des instructions spécifiques, des liens vers des blogs de cuisine ou vos propres variantes de recettes."
                        : "Use this space to jot down specific instructions, links to food blogs, or your own recipe variations."}
                    </p>
                  </section>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
              className="fixed inset-4 md:inset-20 bg-[var(--bg)] z-[110] rounded-[48px] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 md:p-10 border-b border-[var(--secondary)] flex items-center justify-between bg-[var(--bg)] sticky top-0">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl md:text-3xl font-serif font-bold">{viewingPlannerRecipe.title}</h2>
                  <button
                    onClick={() => toggleFavorite(viewingPlannerRecipe)}
                    className={cn(
                      "p-2 rounded-full transition-all hover:scale-110 active:scale-95",
                      isFavorite(viewingPlannerRecipe.id) ? "text-red-500 bg-red-50" : "text-[#8E8E8E] hover:text-red-500 bg-[var(--secondary)]"
                    )}
                    title={isFavorite(viewingPlannerRecipe.id) ? t('removeFromFavorites') : t('addToFavorites')}
                  >
                    <Heart size={20} className={cn(isFavorite(viewingPlannerRecipe.id) && "fill-current")} />
                  </button>
                </div>
                <button 
                  onClick={() => setViewingPlannerRecipe(null)}
                  className="w-10 h-10 bg-[var(--secondary)] rounded-full flex items-center justify-center text-[var(--primary)] hover:bg-[var(--accent)] transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 md:p-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <div className="lg:col-span-1 space-y-8">
                    <div className="bg-[var(--secondary)] p-6 rounded-3xl space-y-4">
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
                            <span className="w-1.5 h-1.5 rounded-full mt-1.5 bg-[var(--primary)] shrink-0" />
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
                            <span className="font-serif italic text-4xl text-[var(--primary)] opacity-20 leading-none shrink-0">{i + 1}</span>
                            <p className="text-base leading-relaxed text-[var(--text)]">{step}</p>
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
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[var(--bg)] z-[70] shadow-2xl border-l border-[var(--accent)] flex flex-col"
            >
              <div className="p-6 border-b border-[var(--accent)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--secondary)] rounded-full flex items-center justify-center text-[var(--primary)]">
                    <ShoppingCart size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-serif font-bold">{t('shoppingListTitle')}</h2>
                    <p className="text-xs text-[#8E8E8E]">{selectedRecipeIds.length} {t('recipesSelected')}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowShoppingList(false)}
                  className="w-8 h-8 rounded-full hover:bg-[var(--secondary)] flex items-center justify-center transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {manualShoppingList.length > 0 && (
                  <section>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#8E8E8E] mb-4">{lang === 'fr' ? 'Articles manuels' : 'Manual Items'}</h3>
                    <div className="bg-[var(--bg)] border border-[var(--accent)] rounded-2xl divide-y divide-[var(--secondary)]">
                      {manualShoppingList.map(item => (
                        <div key={item} className="p-4 flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded border border-[var(--accent)] shrink-0" />
                            <span className="text-sm font-medium">{item}</span>
                          </div>
                          <button 
                            onClick={() => removeFromManualShoppingList(item)}
                            className="text-[#8E8E8E] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {selectedRecipes.length > 0 || manualShoppingList.length > 0 ? (
                  <>
                    {selectedRecipes.length > 0 && (
                      <>
                        <section>
                          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#8E8E8E] mb-4">{t('recipesInPlan')}</h3>
                          <div className="space-y-3">
                            {selectedRecipes.map(recipe => (
                              <div key={recipe.id} className="flex items-center justify-between p-3 bg-[var(--secondary)] rounded-2xl group">
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
                              className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary)] flex items-center gap-1.5 hover:opacity-70"
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
                          <div className="bg-[var(--bg)] border border-[var(--accent)] rounded-2xl divide-y divide-[var(--secondary)]">
                            {aggregateMissingIngredients().length > 0 ? (
                              aggregateMissingIngredients().map((item, i) => (
                                <div key={i} className="p-4 flex items-center gap-3">
                                  <div className="w-4 h-4 rounded border border-[var(--accent)] shrink-0" />
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
                    )}
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-[var(--secondary)] rounded-full flex items-center justify-center text-[#8E8E8E]">
                      <Utensils size={24} />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold">{lang === 'fr' ? 'Votre liste est vide' : 'Your list is empty'}</h3>
                      <p className="text-sm text-[#8E8E8E] max-w-[200px] mx-auto mt-2">
                        {lang === 'fr' ? 'Ajoutez des recettes ou des articles manuels pour générer une liste de courses.' : 'Add recipes or manual items to generate a shopping list.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              { (selectedRecipes.length > 0 || manualShoppingList.length > 0) && (
                <div className="p-6 border-t border-[var(--accent)] bg-[#FDFCFB] flex flex-col gap-3">
                  <button 
                    onClick={copyFullShoppingList}
                    className="w-full py-4 bg-[var(--primary)] text-[var(--bg)] rounded-2xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-[var(--primary)]/20"
                  >
                    <Copy size={18} />
                    {t('copyFullList')}
                  </button>
                  <button 
                    onClick={() => setShowShoppingList(false)}
                    className="w-full py-3 text-[var(--primary)] font-medium hover:bg-[var(--secondary)] rounded-xl transition-colors"
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
            className="fixed bottom-8 right-8 z-[90] bg-[var(--primary)] text-[var(--bg)] px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 hover:opacity-90 transition-all group"
          >
            <ArrowUp size={18} className="group-hover:-translate-y-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-wider pr-1">{t('backToTop')}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-20 border-t border-[var(--accent)] py-12 bg-[var(--bg)]">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-[#8E8E8E] mb-4">© 2026 {t('appName')}. {lang === 'fr' ? 'Propulsé par Gemini AI.' : 'Powered by Gemini AI.'}</p>
          <div className="flex justify-center gap-6 text-[var(--primary)] font-medium text-xs uppercase tracking-widest">
            <a href="#" className="hover:opacity-70 transition-opacity">{lang === 'fr' ? 'Confidentialité' : 'Privacy'}</a>
            <a href="#" className="hover:opacity-70 transition-opacity">{lang === 'fr' ? 'Conditions' : 'Terms'}</a>
            <a href="#" className="hover:opacity-70 transition-opacity">{lang === 'fr' ? 'Support' : 'Support'}</a>
          </div>
        </div>
      </footer>

      {/* Notification Bubble */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-24 left-1/2 z-[200] bg-[var(--primary)] text-[var(--bg)] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 min-w-[200px] justify-center"
          >
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <Check size={14} />
            </div>
            <span className="text-sm font-bold tracking-wide">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}
