import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, Target, Gamepad2, Utensils, 
  Wallet, Package, LogOut, Heart, 
  Plus, Trash2, CheckCircle2, Circle, 
  Leaf, Trophy, ShoppingBag, Box,
  Zap, Star, Edit3, X, Sparkles, Lock,
  Coins, RotateCcw, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useToasts, ToastContainer } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { useStats } from '../contexts/StatsContext';

type Difficulty = 'Łatwy' | 'Średni' | 'Trudny' | 'Legendarny';
type Performer = 'Razem 🫂' | 'Kicek 🐰' | 'Szop 🦝';

interface Quest {
  id: string;
  title: string;
  performer: Performer;
  difficulty: Difficulty;
  lowEnergy: boolean;
  completed: boolean;
  goldReward: number;
  xpReward: number;
  isDaily?: boolean;
}

interface ShopItem {
  id: string;
  title: string;
  price: number;
  emoji: string;
}

interface InventoryItem {
  id: string;
  shopItemId: string;
  title: string;
  emoji: string;
}

const difficultyConfig: Record<Difficulty, { color: string, bg: string, border: string, gold: number, xp: number }> = {
  'Łatwy': { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', gold: 10, xp: 50 },
  'Średni': { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', gold: 25, xp: 125 },
  'Trudny': { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', gold: 50, xp: 250 },
  'Legendarny': { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', gold: 100, xp: 500 },
};

export default function Quests() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toasts, showToast, removeToast } = useToasts();
  const { kicekStats, szopStats, addRewards, spendGold } = useStats();

  // Persistence Helpers
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

  // User Identity
  const profile = {
    nickname: (user?.user_metadata?.name === 'Szop' ? 'Szop 🦝' : 'Kicek 🐰') as Performer
  };
  const isKicek = profile.nickname === 'Kicek 🐰';

  // Current active stats
  const activeStats = isKicek ? kicekStats : szopStats;
  const activeGold = activeStats.gold;
  const activeXp = activeStats.xp;
  const activeLevel = activeStats.level;
  const xpNeeded = activeLevel * 100;

  // Quests State
  const [quests, setQuests] = useState<Quest[]>(() => getFromStorage('app_quests', [
    { id: '1', title: 'Umyć naczynia', performer: 'Szop 🦝', difficulty: 'Średni', lowEnergy: false, completed: false, goldReward: 25, xpReward: 125, isDaily: true },
    { id: '2', title: 'Przygotować kolację', performer: 'Razem 🫂', difficulty: 'Trudny', lowEnergy: false, completed: false, goldReward: 50, xpReward: 250 }
  ]));

  const [activeTab, setActiveTab] = useState<'quests' | 'shop' | 'inventory'>('quests');
  const [newTitle, setNewTitle] = useState('');
  const [newPerformer, setNewPerformer] = useState<Performer>('Razem 🫂');
  const [newDifficulty, setNewDifficulty] = useState<Difficulty>('Łatwy');
  const [isLowEnergy, setIsLowEnergy] = useState(false);
  const [isDaily, setIsDaily] = useState(false);

  const [shopItems, setShopItems] = useState<ShopItem[]>(() => getFromStorage('app_shop_items', [
    { id: 's1', title: 'Masaż stóp', price: 50, emoji: '💆' },
    { id: 's2', title: 'Wyjście na pizzę', price: 150, emoji: '🍕' },
    { id: 's3', title: 'Dzień bez zmywania', price: 100, emoji: '🧼' },
    { id: 's4', title: 'Wybór filmu wieczorem', price: 30, emoji: '🎬' },
    { id: 's5', title: 'Śniadanie do łóżka', price: 80, emoji: '🥐' },
  ]));

  const [inventory, setInventory] = useState<InventoryItem[]>(() => getFromStorage('app_inventory', []));

  // Persistence Effects
  React.useEffect(() => saveToStorage('app_quests', quests), [quests]);
  React.useEffect(() => saveToStorage('app_shop_items', shopItems), [shopItems]);
  React.useEffect(() => saveToStorage('app_inventory', inventory), [inventory]);

  const addQuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    const config = difficultyConfig[newDifficulty];
    const newQuest: Quest = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTitle, performer: newPerformer, difficulty: newDifficulty,
      lowEnergy: isLowEnergy, completed: false, goldReward: config.gold,
      xpReward: config.xp, isDaily: isDaily
    };
    setQuests(prev => [newQuest, ...prev]);
    setNewTitle(''); setIsLowEnergy(false); setIsDaily(false);
    showToast('Nowy quest dodany!', '📜');
  };

  const completeQuest = (id: string) => {
    const quest = quests.find(q => q.id === id);
    if (!quest || quest.completed) return;
    if (quest.performer !== profile.nickname && quest.performer !== 'Razem 🫂') {
      showToast(`To zadanie dla: ${quest.performer}!`, '⛔');
      return;
    }
    setQuests(prev => prev.map(q => q.id === id ? { ...q, completed: true } : q));
    addRewards(quest.performer, quest.goldReward, quest.xpReward);
    showToast(`Quest ukończony! +${quest.goldReward}g +${quest.xpReward} XP!`, '✨');
  };

  const buyItem = (item: ShopItem) => {
    const success = spendGold(isKicek ? 'Kicek 🐰' : 'Szop 🦝', item.price);
    if (!success) { showToast('Za mało złota!', '🪙'); return; }
    const newInvItem = { id: Math.random().toString(36).substr(2, 9), shopItemId: item.id, title: item.title, emoji: item.emoji };
    setInventory(prev => [...prev, newInvItem]);
    showToast(`Kupiono: ${item.title}!`, '🎒');
  };

  return (
    <div className="min-h-screen bg-[#FDF8F3] pb-40">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <header className="p-4 sm:p-8 flex flex-col sm:flex-row justify-between items-center max-w-5xl mx-auto w-full gap-4">
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-5 h-5 text-orange-600" />
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-stone-300">CENTRUM PRZYGÓD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-primary">Questy & <span className="text-orange-600 italic">Nagrody</span></h1>
        </div>
        <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="flex-1 sm:flex-none glass-card px-4 py-2 flex items-center gap-2 border-none shadow-lg shadow-amber-900/5">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 shrink-0"><Coins size={18} /></div>
            <div className="flex flex-col"><span className="text-[7px] sm:text-[9px] font-black uppercase text-stone-300">Złoto</span><span className="text-base sm:text-lg font-black text-brand-primary">{activeGold}</span></div>
          </div>
          <div className="flex-1 sm:flex-none glass-card px-4 py-2 flex items-center gap-2 border-none shadow-lg shadow-blue-900/5">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 shrink-0 relative"><Star size={18} /><div className="absolute top-0 right-0 bg-blue-600 text-white text-[6px] px-1 rounded-bl-md">L{activeLevel}</div></div>
            <div className="flex flex-col"><span className="text-[7px] sm:text-[9px] font-black uppercase text-stone-300">XP</span><span className="text-base sm:text-lg font-black text-brand-primary">{activeXp}<span className="text-[8px] text-stone-300">/{xpNeeded}</span></span></div>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-8 space-y-8 sm:space-y-12 max-w-5xl mx-auto">
        <div className="flex p-1 bg-stone-100 rounded-full w-full max-w-sm mx-auto shadow-inner">
          {['quests', 'shop', 'inventory'].map((tab: any) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={cn("flex-1 py-3 rounded-full font-black uppercase tracking-widest text-[8px] sm:text-[10px] transition-all", activeTab === tab ? "bg-white text-orange-600 shadow-sm" : "text-stone-400 hover:text-stone-600")}>
              {tab === 'quests' ? 'Questy' : tab === 'shop' ? 'Sklep' : 'Plec'}
            </button>
          ))}
        </div>

        {activeTab === 'quests' && (
          <div className="space-y-8 sm:space-y-12 w-full">
            <section className="glass-card p-6 sm:p-10 space-y-6 sm:space-y-8 border-none overflow-hidden">
              <h3 className="text-lg font-black text-brand-primary">Nowy Quest ⚔️</h3>
              <form onSubmit={addQuest} className="space-y-6 flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 px-2">Zadanie</label>
                    <input type="text" placeholder="Np. Umyć naczynia" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full px-5 py-4 bg-[#FFF9F2] border-2 border-orange-50 focus:border-orange-200 outline-none rounded-2xl font-bold text-brand-primary text-base" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-stone-400 px-2">Kto?</label>
                    <div className="flex gap-2">
                      {(['Razem 🫂', 'Kicek 🐰', 'Szop 🦝'] as Performer[]).map(p => (
                        <button key={p} type="button" onClick={() => setNewPerformer(p)} className={cn("flex-1 py-3 rounded-xl border-2 font-bold text-xs transition-all", newPerformer === p ? "bg-orange-50 border-orange-400 text-orange-700" : "bg-white border-stone-50 text-stone-400")}>{p.split(' ')[1]}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <button type="submit" className="w-full py-5 bg-orange-600 text-white font-black rounded-2xl sm:rounded-[2.5rem] shadow-xl active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"><Plus size={18} /> Dodaj teraz</button>
              </form>
            </section>

            <div className="space-y-4">
              <h3 className="text-lg font-black text-brand-primary px-2">Aktywne</h3>
              <div className="grid gap-3">
                {quests.filter(q => !q.completed).map(q => (
                  <div key={q.id} className="bg-white p-5 rounded-[2rem] border-2 border-stone-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                    <div className="flex items-start gap-4">
                      <button onClick={() => completeQuest(q.id)} className="w-10 h-10 mt-1 rounded-full border-2 border-stone-100 flex items-center justify-center text-stone-100 hover:text-emerald-500 transition-all active:scale-90"><Circle size={24} /></button>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 items-wrap">
                          <span className={cn("px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest", difficultyConfig[q.difficulty].bg, difficultyConfig[q.difficulty].color)}>{q.difficulty}</span>
                          <span className="text-[8px] font-black text-stone-300 uppercase tracking-widest">{q.performer}</span>
                        </div>
                        <h4 className="font-black text-brand-primary">{q.title}</h4>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0">
                       <div className="flex gap-2">
                        <div className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black border border-amber-100">🪙 {q.goldReward}</div>
                        <div className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black border border-blue-100">✨ {q.xpReward}</div>
                      </div>
                      <button onClick={() => setQuests(prev => prev.filter(x => x.id !== q.id))} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             {shopItems.map(item => (
                <div key={item.id} className="bg-white p-6 rounded-[2.5rem] border-2 border-stone-50 text-center space-y-4">
                   <div className="w-16 h-16 bg-orange-50 rounded-[1.5rem] flex items-center justify-center text-3xl mx-auto">{item.emoji}</div>
                   <h4 className="font-black text-brand-primary">{item.title}</h4>
                   <button onClick={() => buyItem(item)} className={cn("w-full py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all", activeGold >= item.price ? "bg-stone-800 text-white" : "bg-stone-50 text-stone-300")}>Wykup za {item.price}g</button>
                </div>
             ))}
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             {inventory.map(item => (
                <div key={item.id} className="bg-white p-6 rounded-[2.5rem] border-2 border-stone-50 text-center space-y-4">
                   <div className="w-16 h-16 bg-blue-50 rounded-[1.5rem] flex items-center justify-center text-3xl mx-auto">{item.emoji}</div>
                   <h4 className="font-black text-brand-primary">{item.title}</h4>
                   <button onClick={() => setInventory(prev => prev.filter(x => x.id !== item.id))} className="w-full py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Wykorzystaj teraz</button>
                </div>
             ))}
          </div>
        )}
      </main>
    </div>
  );
}
