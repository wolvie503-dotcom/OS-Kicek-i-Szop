import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, Target, Gamepad2, Utensils, 
  Wallet, Package, LogOut, Star, 
  Plus, Trash2, CheckCircle2, Circle, 
  Flame, Clock, ChevronRight, PlusCircle,
  ChefHat, Pizza, Coffee, Apple, ArrowLeft,
  X, Save, Info, Search, Coins, Zap, ShoppingCart,
  ChevronLeft, Calendar, Copy, Minus, AlertTriangle, Heart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useToasts, ToastContainer } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { useStats } from '../contexts/StatsContext';

type MealType = 'Śniadanie' | 'Drugie Śniadanie' | 'Obiad' | 'Przekąska' | 'Kolacja';
type Difficulty = 'Łatwy' | 'Średni' | 'Trudny';

interface Recipe {
  id: string;
  title: string;
  emoji: string;
  category: string;
  kcal: number; 
  portions: number;
  preparationTime: number;
  difficulty: Difficulty;
  instructions: string;
  ingredients?: string[];
}

interface LoggedMeal {
  id: string;
  name: string;
  kcal: number;
  mealType: MealType;
  recipeId?: string;
  portionsLogged?: number;
}

interface ShoppingItem {
  id: string;
  name: string;
  isBought: boolean;
}

interface PantryItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
}

const mealConfigs: Record<MealType, { emoji: string; color: string; bg: string }> = {
  'Śniadanie': { emoji: '🍳', color: 'text-amber-600', bg: 'bg-amber-50' },
  'Drugie Śniadanie': { emoji: '🍎', color: 'text-orange-500', bg: 'bg-orange-50' },
  'Obiad': { emoji: '🍲', color: 'text-red-600', bg: 'bg-red-50' },
  'Przekąska': { emoji: '🥨', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  'Kolacja': { emoji: '🥗', color: 'text-teal-600', bg: 'bg-teal-50' },
};

export default function Food() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { toasts, showToast, removeToast } = useToasts();
  const { kicekStats, szopStats } = useStats();

  const isKicek = user?.user_metadata?.name !== 'Szop';
  const currentCharacter = isKicek ? 'Kicek' : 'Szop';
  const partnerCharacter = isKicek ? 'Szop' : 'Kicek';

  // --- PERSISTENCE HELPERS ---
  const getFromStorage = <T,>(key: string, defaultValue: T): T => {
    const saved = localStorage.getItem(key);
    if (!saved) return defaultValue;
    try {
      return JSON.parse(saved);
    } catch {
      return defaultValue;
    }
  };

  const saveToStorage = (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  // --- STATE ---
  const [recipes, setRecipes] = React.useState<Recipe[]>(() => {
    const saved = localStorage.getItem('food_recipes');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'r1',
        title: 'Omlet z Awokado', emoji: '🥑', category: 'Śniadanie', kcal: 450, portions: 1, 
        preparationTime: 10, difficulty: 'Łatwy', instructions: '1. Rozbij jajka. 2. Pokrój awokado. 3. Smaż na maśle.',
        ingredients: ['2 Jajka', '1/2 Awokado', 'Masło', 'Sól', 'Pieprz']
      },
      {
        id: 'r2',
        title: 'Pesto Pasta', emoji: '🍝', category: 'Obiad', kcal: 1300, portions: 2, 
        preparationTime: 15, difficulty: 'Łatwy', instructions: '1. Ugotuj makaron. 2. Wymieszaj z pesto i parmezanem.',
        ingredients: ['Makaron 200g', 'Pesto 100g', 'Parmezan']
      }
    ];
  });

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [userDailyMeals, setUserDailyMeals] = useState<Record<string, LoggedMeal[]>>(() => getFromStorage(`food_daily_meals_${currentCharacter}`, {}));
  const [partnerDailyMeals, setPartnerDailyMeals] = useState<Record<string, LoggedMeal[]>>(() => getFromStorage(`food_daily_meals_${partnerCharacter}`, {}));
  const [kcalGoal, setKcalGoal] = useState<number>(() => getFromStorage(`food_goal_${currentCharacter}`, isKicek ? 2000 : 2500));
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(() => getFromStorage('food_shopping_list', []));
  const [pantryItems, setPantryItems] = useState<PantryItem[]>(() => getFromStorage('food_pantry_items', []));

  React.useEffect(() => saveToStorage('food_recipes', recipes), [recipes]);
  React.useEffect(() => saveToStorage(`food_daily_meals_${currentCharacter}`, userDailyMeals), [userDailyMeals, currentCharacter]);
  React.useEffect(() => saveToStorage(`food_goal_${currentCharacter}`, kcalGoal), [kcalGoal, currentCharacter]);
  React.useEffect(() => saveToStorage('food_shopping_list', shoppingList), [shoppingList]);
  React.useEffect(() => saveToStorage('food_pantry_items', pantryItems), [pantryItems]);

  React.useEffect(() => {
    const loadPartnerData = () => setPartnerDailyMeals(getFromStorage(`food_daily_meals_${partnerCharacter}`, {}));
    loadPartnerData();
    const interval = setInterval(loadPartnerData, 5000);
    return () => clearInterval(interval);
  }, [partnerCharacter]);

  const currentMeals = userDailyMeals[selectedDate] || [];
  const totalKcal = useMemo(() => currentMeals.reduce((acc, m) => acc + m.kcal, 0), [currentMeals]);
  const partnerCurrentMeals = partnerDailyMeals[selectedDate] || [];
  const partnerTotalKcal = useMemo(() => partnerCurrentMeals.reduce((acc, m) => acc + m.kcal, 0), [partnerCurrentMeals]);
  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const progressPercent = Math.min(100, (totalKcal / kcalGoal) * 100);

  const changeDay = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [tempGoal, setTempGoal] = useState(kcalGoal);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [portionsToLog, setPortionsToLog] = useState(1);
  const [targetMealType, setTargetMealType] = useState<MealType>('Obiad');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickAdd, setQuickAdd] = useState({ name: '', kcal: 0, mealType: 'Obiad' as MealType });
  const [newRecipe, setNewRecipe] = useState<Partial<Recipe>>({
    title: '', emoji: '🍴', category: 'Obiad', kcal: 0, portions: 1, 
    preparationTime: 20, difficulty: 'Łatwy', instructions: '', ingredients: []
  });
  const [newItemName, setNewItemName] = useState('');

  const handleAddQuickMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAdd.name || quickAdd.kcal <= 0) return;
    const meal: LoggedMeal = { id: Math.random().toString(36).substr(2, 9), ...quickAdd };
    setUserDailyMeals(prev => ({ ...prev, [selectedDate]: [...(prev[selectedDate] || []), meal] }));
    setQuickAdd({ ...quickAdd, name: '', kcal: 0 });
    showToast(`Dodano: ${meal.name}! 😋`, '🍽️');
  };

  const addRecipeToMenu = (recipe: Recipe, mealType: MealType, portions: number = 1) => {
    const totalAddedKcal = Math.round(recipe.kcal / recipe.portions) * portions;
    const meal: LoggedMeal = {
      id: Math.random().toString(36).substr(2, 9),
      name: portions > 1 ? `${recipe.title} (${portions} porcje)` : recipe.title,
      kcal: totalAddedKcal, mealType, recipeId: recipe.id, portionsLogged: portions
    };
    setUserDailyMeals(prev => ({ ...prev, [selectedDate]: [...(prev[selectedDate] || []), meal] }));
    showToast(`${recipe.title} dodane! 🍲`, '✨');
    setSelectedRecipe(null);
  };

  const handleSaveRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipe.title) return;
    const recipe: Recipe = { id: Math.random().toString(36).substr(2, 9), ...newRecipe } as Recipe;
    setRecipes(prev => [recipe, ...prev]);
    setShowRecipeModal(false);
    showToast(`Zapisano przepis! 📖`, '✅');
  };

  const deleteRecipe = (id: string, title: string) => {
    if (window.confirm(`Usunąć "${title}"?`)) {
      setRecipes(prev => prev.filter(r => r.id !== id));
    }
  };

  const addToShoppingList = (name: string) => {
    if (!name.trim()) return;
    setShoppingList(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), name: name.trim(), isBought: false }]);
  };

  const toggleShoppingItem = (id: string) => setShoppingList(prev => prev.map(item => item.id === id ? { ...item, isBought: !item.isBought } : item));
  const removeShoppingItem = (id: string) => setShoppingList(prev => prev.filter(item => item.id !== id));
  const clearBoughtItems = () => setShoppingList(prev => prev.filter(item => !item.isBought));

  const [newPantryItem, setNewPantryItem] = useState({ name: '', amount: 1, unit: 'szt' });
  const [isPantryFormOpen, setIsPantryFormOpen] = useState(false);

  // --- HELPERS FOR PANTRY & RECIPES ---
  const checkIngredientInPantry = (ingredientName: string) => {
    return pantryItems.find(item => 
      ingredientName.toLowerCase().includes(item.name.toLowerCase()) || 
      item.name.toLowerCase().includes(ingredientName.toLowerCase())
    );
  };

  const getRecipeIngredientsStatus = (recipe: Recipe) => {
    if (!recipe.ingredients || recipe.ingredients.length === 0) return null;
    const total = recipe.ingredients.length;
    const available = recipe.ingredients.filter(ing => {
      const item = checkIngredientInPantry(ing);
      return item && item.amount > 0;
    }).length;
    return { available, total };
  };

  const openRecipeDetail = (recipe: Recipe, mealType: MealType) => {
    setSelectedRecipe(recipe);
    setTargetMealType(mealType);
    setPortionsToLog(1);
  };

  const addToPantry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPantryItem.name) return;
    setPantryItems(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), ...newPantryItem }]);
    setNewPantryItem({ name: '', amount: 1, unit: 'szt' });
  };

  const updatePantryAmount = (id: string, delta: number) => setPantryItems(prev => prev.map(item => item.id === id ? { ...item, amount: Math.max(0, item.amount + delta) } : item));
  const removePantryItem = (id: string) => setPantryItems(prev => prev.filter(item => item.id !== id));
  const moveMissingToShoppingList = () => {
    const missing = pantryItems.filter(item => item.amount === 0).map(item => ({ id: Math.random().toString(36).substr(2, 9), name: `${item.name} (${item.unit})`, isBought: false }));
    setShoppingList(prev => [...prev, ...missing]);
    showToast('Braki dodane do listy! 🛒', '✅');
  };

  const removeLoggedMeal = (id: string) => setUserDailyMeals(prev => ({ ...prev, [selectedDate]: (prev[selectedDate] || []).filter(m => m.id !== id) }));
  const filteredRecipes = recipes.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.category.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#FDF8F3] pb-40">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-12">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start gap-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <Utensils className="w-5 h-5 text-amber-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300">KUCHNIA</span>
            </div>
            <h1 className="text-3xl font-black text-brand-primary">Nasza <span className="text-amber-600 italic">restauracja</span></h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="glass-card px-3 py-2 flex items-center gap-2 border-stone-100 shadow-sm opacity-80 shrink-0">
               <span className="text-[10px] font-black">{partnerCharacter}: {partnerTotalKcal} kcal</span>
            </div>
            <div className="glass-card px-4 py-2 border-amber-200 bg-orange-50/50 shadow-sm">
               <span className="text-xs font-black text-brand-primary">{totalKcal} / {kcalGoal} kcal</span>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <section className="glass-card p-4 rounded-[2.5rem] bg-white/40 flex items-center justify-between border-stone-100">
          <button onClick={() => changeDay(-1)} className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center hover:shadow-lg transition-all"><ChevronLeft /></button>
          <div className="text-center">
            <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest leading-none">PRZEBIEG PYSZNOŚCI</p>
            <h2 className="text-xl font-black text-brand-primary italic">{isToday ? 'Dzisiaj: ' : ''} {new Date(selectedDate).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
          </div>
          <button onClick={() => changeDay(1)} className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center hover:shadow-lg transition-all"><ChevronRight /></button>
        </section>

        {/* Menu Section */}
        <section className="space-y-4 sm:space-y-6">
          <h2 className="text-xl sm:text-2xl font-black text-brand-primary flex items-center gap-3">
            <Pizza className="text-orange-500 w-5 h-5 sm:w-6 sm:h-6" /> Jadłospis
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {(Object.keys(mealConfigs) as MealType[]).map((type) => {
              const meals = currentMeals.filter(m => m.mealType === type);
              return (
                <div key={type} className="bg-white p-3 sm:p-5 rounded-[2rem] sm:rounded-[2.5rem] border-2 border-stone-50 flex flex-col min-h-[auto] sm:min-h-[220px] shadow-sm">
                  <div className="flex justify-between items-center mb-2 sm:mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl sm:text-2xl">{mealConfigs[type].emoji}</span>
                      <span className="text-[10px] sm:text-[8px] font-black uppercase text-stone-300">{type}</span>
                    </div>
                    <span className="text-[10px] font-black text-amber-600 sm:hidden">{meals.reduce((s, m) => s + m.kcal, 0)} kcal</span>
                  </div>
                  <div className="flex-1 space-y-1.5 mb-3 sm:mb-0">
                    {meals.map(m => (
                      <div key={m.id} className="bg-stone-50 px-3 py-2 sm:p-2 rounded-xl flex items-center justify-between group relative">
                        <div>
                          <p className="text-[11px] sm:text-[9px] font-bold truncate max-w-[120px] sm:max-w-full">{m.name}</p>
                          <p className="text-[9px] sm:text-[8px] font-black text-amber-600 leading-none">{m.kcal} kcal</p>
                        </div>
                        <button onClick={() => removeLoggedMeal(m.id)} className="text-stone-300 hover:text-red-400 p-1 sm:absolute sm:right-1 sm:top-1 sm:text-stone-200"><X size={12} /></button>
                      </div>
                    ))}
                    {meals.length === 0 && <p className="text-[10px] text-stone-200 italic py-2 hidden sm:block text-center uppercase font-black">Brak</p>}
                  </div>
                  <div className="pt-2 sm:pt-3 border-t flex justify-between items-center sm:mt-auto">
                    <span className="text-[10px] font-black hidden sm:block">{meals.reduce((s, m) => s + m.kcal, 0)} kcal</span>
                    <button onClick={() => { setSelectedRecipe(null); setTargetMealType(type); setShowRecipeModal(true); }} className="w-full sm:w-8 h-8 rounded-xl sm:rounded-full bg-stone-50 text-stone-300 hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest sm:tracking-normal">
                      <Plus size={14} /> <span className="sm:hidden">Dodaj</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick Add - Horizontal Scroll on Mobile */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg sm:text-xl font-black text-brand-primary flex items-center gap-3"><Zap className="text-orange-500" /> Szybka przekąska</h3>
          </div>
          <div className="flex sm:grid sm:grid-cols-12 gap-3 overflow-x-auto pb-4 px-1 sm:p-0 scrollbar-hide">
            {/* Common quick snacks as chips contextually */}
            {['☕ Kawa', '🍏 Jabłko', '🥨 Precel', '🥤 Sok'].map(snack => (
              <button key={snack} onClick={() => {
                const kcal = snack.includes('Kawa') ? 50 : snack.includes('Jabłko') ? 80 : 150;
                setQuickAdd({ name: snack.split(' ')[1], kcal, mealType: 'Przekąska' });
              }} className="whitespace-nowrap bg-white px-5 py-3 rounded-2xl border-2 border-stone-50 font-bold text-sm shadow-sm hover:border-amber-200 transition-all">
                {snack}
              </button>
            ))}
          </div>
          
          <form onSubmit={handleAddQuickMeal} className="glass-card p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] bg-amber-50/50 border-amber-100 border-2 flex flex-col sm:flex-row gap-3">
            <input type="text" placeholder="Co jemy?" value={quickAdd.name} onChange={e => setQuickAdd({...quickAdd, name: e.target.value})} className="flex-1 bg-white px-5 py-3.5 sm:px-6 sm:py-4 rounded-2xl sm:rounded-[2rem] border-2 border-stone-100 outline-none focus:border-amber-400 font-bold text-sm sm:text-base" />
            <div className="flex gap-3">
              <input type="number" placeholder="Kcal" value={quickAdd.kcal || ''} onChange={e => setQuickAdd({...quickAdd, kcal: parseInt(e.target.value) || 0})} className="w-24 sm:w-32 bg-white px-4 py-3.5 sm:px-6 sm:py-4 rounded-2xl sm:rounded-[2rem] border-2 border-stone-100 outline-none focus:border-amber-400 font-bold text-sm" />
              <select value={quickAdd.mealType} onChange={e => setQuickAdd({...quickAdd, mealType: e.target.value as MealType})} className="flex-1 sm:flex-none bg-white px-4 sm:px-6 py-3.5 sm:py-4 rounded-2xl sm:rounded-[2rem] border-2 border-stone-100 font-bold outline-none text-sm">
                {Object.keys(mealConfigs).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <button type="submit" className="bg-brand-primary text-white w-full sm:w-auto sm:px-8 h-12 sm:h-16 rounded-2xl sm:rounded-[2rem] font-black uppercase text-[10px] sm:text-xs tracking-widest hover:shadow-xl flex items-center justify-center gap-2">
              <Plus size={18} /> <span className="sm:hidden">Dodaj</span>
            </button>
          </form>
        </section>

        {/* Shopping List - New Compact Checklist Layout */}
        <section className="bg-white p-6 sm:p-10 rounded-[3rem] border-2 border-stone-50 shadow-lg space-y-6">
           <div className="flex justify-between items-center">
             <h2 className="text-xl sm:text-2xl font-black text-brand-primary flex items-center gap-3"><ShoppingCart className="text-emerald-500 w-5 h-5 sm:w-6 sm:h-6" /> Lista Zakupów</h2>
             <button onClick={clearBoughtItems} className="text-[9px] font-black uppercase text-stone-300 hover:text-red-500 tracking-tighter">Wyczyść kupione</button>
           </div>
           
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
             <div className="lg:col-span-4 space-y-3">
                <div className="relative">
                  <input type="text" placeholder="Dodaj produkt..." value={newItemName} onChange={e => setNewItemName(e.target.value)} onKeyDown={e => e.key === 'Enter' && (addToShoppingList(newItemName), setNewItemName(''))} className="w-full bg-stone-50 border-2 border-transparent rounded-2xl px-5 py-3.5 font-bold text-brand-primary text-sm outline-none focus:bg-white focus:border-emerald-200 transition-all pr-12" />
                  <button onClick={() => { addToShoppingList(newItemName); setNewItemName(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md"><Plus size={16}/></button>
                </div>
                <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Postęp</span>
                  <span className="text-xs font-black text-emerald-600">{shoppingList.filter(i => i.isBought).length}/{shoppingList.length}</span>
                </div>
             </div>
             <div className="lg:col-span-8 flex flex-col divide-y divide-stone-50 max-h-[300px] overflow-y-auto pr-1 scrollbar-hide">
               {shoppingList.map(item => (
                 <div key={item.id} className="group py-2 flex items-center justify-between hover:bg-stone-50/50 px-2 rounded-xl transition-all">
                   <div className="flex items-center gap-3 flex-1 min-w-0">
                     <button onClick={() => toggleShoppingItem(item.id)} className={cn("w-5 h-5 rounded-md border-2 shrink-0 transition-all", item.isBought ? "bg-emerald-500 border-emerald-500 text-white flex items-center justify-center scale-95" : "border-stone-200")}>
                        {item.isBought && <CheckCircle2 size={12} />}
                     </button>
                     <span className={cn("font-bold text-[13px] sm:text-sm truncate transition-all", item.isBought ? "text-stone-300 line-through" : "text-brand-primary")}>{item.name}</span>
                   </div>
                   <button onClick={() => removeShoppingItem(item.id)} className="text-stone-300 hover:text-red-500 sm:opacity-0 group-hover:opacity-100 p-1.5 ml-2">
                     <X size={14} />
                   </button>
                 </div>
               ))}
               {shoppingList.length === 0 && (
                 <p className="py-8 text-center text-xs font-black text-stone-200 uppercase tracking-[0.2em]">Lista jest pusta</p>
               )}
             </div>
           </div>
        </section>


        {/* Pantry */}
        <section className="bg-[#FAF3E0] p-6 sm:p-10 rounded-[3rem] border-2 border-[#EAD7B2] shadow-lg space-y-6">
           <div className="flex justify-between items-center">
             <div className="flex items-center gap-3">
               <h2 className="text-xl sm:text-2xl font-black text-brand-primary flex items-center gap-2">
                 <Package className="text-amber-700 w-5 h-5 sm:w-6 sm:h-6" /> Spiżarnia
               </h2>
               <button 
                 onClick={() => setIsPantryFormOpen(!isPantryFormOpen)} 
                 className={cn(
                   "w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white shadow-sm border border-amber-200",
                   isPantryFormOpen ? "rotate-45 text-red-500" : "text-amber-700"
                 )}
               >
                 <Plus size={18} />
               </button>
             </div>
             <button onClick={moveMissingToShoppingList} className="bg-white text-amber-700 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm hover:bg-amber-50 transition-colors">Uzupełnij braki</button>
           </div>

           <AnimatePresence>
             {isPantryFormOpen && (
               <motion.div 
                 initial={{ height: 0, opacity: 0 }} 
                 animate={{ height: 'auto', opacity: 1 }} 
                 exit={{ height: 0, opacity: 0 }} 
                 className="overflow-hidden"
               >
                 <form onSubmit={addToPantry} className="bg-white p-5 rounded-3xl space-y-4 mb-4 border border-amber-100 shadow-sm">
                   <input type="text" placeholder="Nazwa produktu" value={newPantryItem.name} onChange={e => setNewPantryItem({...newPantryItem, name: e.target.value})} className="w-full bg-stone-50 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-amber-400 border-2 border-transparent transition-all" />
                   <div className="grid grid-cols-2 gap-2">
                      <input type="number" placeholder="Ilość" value={newPantryItem.amount} onChange={e => setNewPantryItem({...newPantryItem, amount: parseFloat(e.target.value) || 0})} className="w-full bg-stone-50 rounded-xl px-4 py-3 font-bold text-sm" />
                      <select value={newPantryItem.unit} onChange={e => setNewPantryItem({...newPantryItem, unit: e.target.value})} className="w-full bg-stone-50 rounded-xl px-4 py-3 font-bold text-sm">
                         <option value="szt">szt</option><option value="kg">kg</option><option value="g">g</option><option value="ml">ml</option><option value="l">l</option>
                      </select>
                   </div>
                   <button type="submit" className="w-full py-3 bg-amber-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest">Dodaj do spiżarni</button>
                 </form>
               </motion.div>
             )}
           </AnimatePresence>

           <div className="bg-white rounded-[2rem] overflow-hidden border border-amber-100 shadow-sm">
             <div className="divide-y divide-amber-100 max-h-[400px] overflow-y-auto custom-scrollbar">
               {pantryItems.length > 0 ? pantryItems.map(item => (
                 <div key={item.id} className="px-4 py-2 sm:py-3 flex justify-between items-center hover:bg-amber-50/30 transition-colors">
                    <div className="flex items-center gap-3">
                      {item.amount === 0 ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-[8px] font-black text-red-500 uppercase tracking-tighter">BRAK</span>
                        </div>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      )}
                      <div>
                        <p className={cn("font-bold text-sm sm:text-base leading-none", item.amount === 0 && "text-stone-400")}>{item.name}</p>
                        <p className="text-[10px] text-stone-400 font-medium">{item.unit}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center bg-stone-50 rounded-xl p-1 gap-1 border border-stone-100">
                        <button 
                          onClick={() => updatePantryAmount(item.id, -1)} 
                          className="w-7 h-7 rounded-lg hover:bg-white hover:shadow-sm text-stone-600 transition-all flex items-center justify-center"
                        >
                          <Minus size={14}/>
                        </button>
                        <span className="w-10 text-center font-black text-xs text-brand-primary">{item.amount}</span>
                        <button 
                          onClick={() => updatePantryAmount(item.id, 1)} 
                          className="w-7 h-7 rounded-lg hover:bg-white hover:shadow-sm text-stone-600 transition-all flex items-center justify-center"
                        >
                          <Plus size={14}/>
                        </button>
                      </div>
                      <button 
                        onClick={() => removePantryItem(item.id)} 
                        className="text-stone-300 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                 </div>
               )) : (
                 <div className="py-12 text-center">
                   <Package className="w-12 h-12 text-stone-100 mx-auto mb-3" />
                   <p className="text-xs font-black text-stone-300 uppercase tracking-widest">Spiżarnia jest pusta</p>
                 </div>
               )}
             </div>
           </div>
        </section>

        {/* Recipes */}
        <section className="space-y-6">
           <div className="flex justify-between items-center">
             <h2 className="text-2xl font-black text-brand-primary flex items-center gap-3"><ChefHat className="text-amber-600" /> Książka Kucharska</h2>
             <button onClick={() => setShowRecipeModal(true)} className="bg-amber-100 text-amber-700 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest">+ Nowy Przepis</button>
           </div>
           <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
             {filteredRecipes.map(r => {
               const status = getRecipeIngredientsStatus(r);
               return (
                 <div key={r.id} onClick={() => openRecipeDetail(r, r.category as MealType)} className="bg-white p-5 rounded-[2.5rem] border-2 border-stone-50 hover:border-amber-100 transition-all cursor-pointer group shadow-sm flex flex-col">
                    <div className="flex justify-between mb-4">
                      <span className="text-3xl">{r.emoji}</span>
                      <button onClick={(e) => { e.stopPropagation(); deleteRecipe(r.id, r.title); }} className="text-stone-200 group-hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                    </div>
                    <h3 className="font-black text-brand-primary flex-1">{r.title}</h3>
                    {status && (
                      <div className="mb-3 flex items-center gap-1.5">
                        <div className={cn("w-1.5 h-1.5 rounded-full", status.available === status.total ? "bg-emerald-500" : "bg-amber-400")} />
                        <span className="text-[9px] font-black text-stone-400 uppercase tracking-tighter">
                          Masz {status.available} z {status.total}
                        </span>
                      </div>
                    )}
                    <div className="pt-3 border-t text-[9px] font-black text-stone-300 uppercase flex gap-4">
                      <span>{r.preparationTime}m</span>
                      <span>{Math.round(r.kcal / r.portions)} kcal</span>
                    </div>
                 </div>
               );
             })}
           </div>
        </section>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {selectedRecipe && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedRecipe(null)} className="absolute inset-0 bg-stone-900/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl bg-[#FDF8F3] rounded-[3.5rem] shadow-2xl p-8 sm:p-12 overflow-y-auto max-h-[90vh]">
               <button onClick={() => setSelectedRecipe(null)} className="absolute top-6 right-6 text-stone-400 hover:text-stone-900"><X size={28} /></button>
               <div className="flex items-start gap-8 mb-8">
                 <div className="w-32 h-32 bg-white rounded-[2rem] flex items-center justify-center text-6xl shadow-xl">{selectedRecipe.emoji}</div>
                 <div className="space-y-2">
                    <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[9px] font-black uppercase">{selectedRecipe.category}</span>
                    <h2 className="text-3xl font-black text-brand-primary">{selectedRecipe.title}</h2>
                    <p className="text-stone-400 font-bold text-sm">{selectedRecipe.kcal} kcal (całość) • {selectedRecipe.portions} porcji</p>
                 </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                 <div className="space-y-4">
                    <h3 className="font-black flex items-center gap-2"><Info size={18}/> Składniki</h3>
                    <div className="bg-white p-6 rounded-3xl shadow-inner border border-stone-50 space-y-2 text-sm text-stone-600">
                        {selectedRecipe.ingredients?.map((ing, i) => {
                          const pantryItem = checkIngredientInPantry(ing);
                          const hasIt = pantryItem && pantryItem.amount > 0;
                          return (
                            <div key={i} className="flex items-center justify-between group py-1 border-b border-stone-50 last:border-0">
                               <div className="flex items-center gap-2">
                                 {hasIt ? (
                                   <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                                 ) : (
                                   <ShoppingCart size={14} className="text-amber-400 shrink-0" />
                                 )}
                                 <span className={cn("font-medium", hasIt ? "text-brand-primary" : "text-stone-400")}>{ing}</span>
                               </div>
                               {!hasIt && (
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); addToShoppingList(ing); showToast(`Dodano ${ing}🛒`, '✅'); }} 
                                   className="opacity-0 group-hover:opacity-100 bg-stone-50 px-2 py-1 rounded-lg text-[8px] font-black text-amber-600 uppercase transition-all"
                                 >
                                   + do listy
                                 </button>
                               )}
                            </div>
                          );
                        })}
                    </div>
                 </div>
                 <div className="space-y-4">
                    <h3 className="font-black flex items-center gap-2"><ChefHat size={18}/> Wykonanie</h3>
                    <p className="text-sm text-stone-600 leading-relaxed bg-white p-6 rounded-3xl border border-stone-50 shadow-inner whitespace-pre-wrap">{selectedRecipe.instructions}</p>
                 </div>
               </div>
               <div className="bg-amber-100/50 p-6 rounded-[2.5rem] flex flex-col sm:flex-row gap-4 items-center">
                  <div className="flex-1 text-center sm:text-left"><p className="font-black text-brand-primary">Ile zjadłeś? 🍽️</p></div>
                  <div className="flex gap-4 items-center bg-white p-2 rounded-xl">
                    <button onClick={() => setPortionsToLog(Math.max(1, portionsToLog - 1))} className="w-8 h-8 font-black text-xl">-</button>
                    <span className="font-black text-xl">{portionsToLog}</span>
                    <button onClick={() => setPortionsToLog(portionsToLog + 1)} className="w-8 h-8 font-black text-xl">+</button>
                  </div>
                  <button onClick={() => addRecipeToMenu(selectedRecipe, targetMealType, portionsToLog)} className="bg-brand-primary text-white px-8 py-4 rounded-xl font-black uppercase text-xs tracking-widest">Dodaj do dziennika</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Goal Setter Modal */}
      <AnimatePresence>
        {showGoalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowGoalModal(false)} className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" />
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white rounded-[3rem] p-10 shadow-2xl">
                <h3 className="text-xl font-black mb-8 flex items-center gap-3"><Target className="text-amber-500" /> Dzienny Cel</h3>
                <div className="bg-amber-50 rounded-[2rem] p-8 text-center mb-8">
                  <input type="number" value={tempGoal} onChange={e => setTempGoal(parseInt(e.target.value) || 0)} className="w-full text-center text-5xl font-black bg-transparent outline-none text-brand-primary" />
                  <p className="text-[10px] font-black text-stone-400 mt-2">KCAL DZIENNIE</p>
                </div>
                <button onClick={() => { setKcalGoal(tempGoal); setShowGoalModal(false); showToast('Zapisano cel! 🎯', '✨'); }} className="w-full py-5 bg-brand-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest">Zapisz Cel</button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
