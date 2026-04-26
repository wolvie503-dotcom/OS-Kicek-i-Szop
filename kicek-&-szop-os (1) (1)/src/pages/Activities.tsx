import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, Target, Gamepad2, Utensils, 
  Wallet, Package, LogOut, Star, 
  Plus, Trash2, CheckCircle2, Circle, 
  Film, Book, Gamepad, Users, 
  Rabbit, Zap, Dumbbell, Sparkles,
  Play, Clock, Check, Dices, X, Coins,
  Heart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useToasts, ToastContainer } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { useStats } from '../contexts/StatsContext';

type ActivityStatus = 'Do zrobienia' | 'W trakcie' | 'Ukończone';

interface Activity {
  id: string;
  title: string;
  status: ActivityStatus;
  rating: number;
  category: string;
}

interface TabConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  accent: string;
}

const tabs: TabConfig[] = [
  { id: 'watching', label: 'Oglądanie', icon: <Film size={18} />, color: 'text-red-600', bg: 'bg-red-50', accent: 'border-red-100' },
  { id: 'books', label: 'Książki', icon: <Book size={18} />, color: 'text-amber-700', bg: 'bg-amber-50', accent: 'border-amber-100' },
  { id: 'games', label: 'Gry', icon: <Gamepad size={18} />, color: 'text-indigo-600', bg: 'bg-indigo-50', accent: 'border-indigo-100' },
  { id: 'together', label: 'Wspólne', icon: <Users size={18} />, color: 'text-rose-500', bg: 'bg-rose-50', accent: 'border-rose-100' },
  { id: 'kicek', label: 'Kick🐰', icon: <Rabbit size={18} />, color: 'text-sky-600', bg: 'bg-sky-50', accent: 'border-sky-100' },
  { id: 'szop', label: 'Szop🦝', icon: <Zap size={18} />, color: 'text-orange-600', bg: 'bg-orange-50', accent: 'border-orange-100' },
  { id: 'exercise', label: 'Sport', icon: <Dumbbell size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-50', accent: 'border-emerald-100' },
  { id: 'bucket', label: 'Lista✨', icon: <Sparkles size={18} />, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50', accent: 'border-fuchsia-100' },
];

export default function Activities() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toasts, showToast, removeToast } = useToasts();
  const { kicekStats, szopStats } = useStats();
  
  const isKicek = user?.user_metadata?.name !== 'Szop';
  const activeStats = isKicek ? kicekStats : szopStats;

  const getFromStorage = <T,>(key: string, defaultValue: T): T => {
    const saved = localStorage.getItem(key);
    if (!saved) return defaultValue;
    try { return JSON.parse(saved); } catch { return defaultValue; }
  };

  const saveToStorage = (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  const [activeTabId, setActiveTabId] = useState('watching');
  const [activities, setActivities] = useState<Activity[]>(() => getFromStorage('app_activities', [
    { id: '1', title: 'The Bear (Serial)', status: 'W trakcie', rating: 5, category: 'watching' },
  ]));

  React.useEffect(() => { saveToStorage('app_activities', activities); }, [activities]);

  const [newTitle, setNewTitle] = useState('');
  const [newStatus, setNewStatus] = useState<ActivityStatus>('Do zrobienia');

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const filteredActivities = activities.filter(a => a.category === activeTabId);

  const addActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    const newActivity: Activity = { id: Date.now().toString(), title: newTitle, status: newStatus, rating: 0, category: activeTabId };
    setActivities(prev => [newActivity, ...prev]);
    setNewTitle('');
    showToast(`Dodano: ${newActivity.title}!`, '✅');
  };

  const randomize = () => {
    const pool = filteredActivities.filter(a => a.status === 'Do zrobienia');
    if (pool.length === 0) { showToast('Brak pozycji!', '🎲'); return; }
    const winner = pool[Math.floor(Math.random() * pool.length)];
    showToast(`Los na dziś: ${winner.title}! 🥳`, '🎲');
  };

  return (
    <div className="min-h-screen bg-[#FDF8F3] pb-40">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <header className="p-4 sm:p-8 flex justify-between items-center max-w-5xl mx-auto w-full">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Gamepad2 className="w-5 h-5 text-orange-600" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300">AKTYWNOŚCI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-primary">Co robimy <span className="text-orange-600 italic">dziś?</span></h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={randomize} className="w-12 h-12 bg-brand-primary text-white font-black rounded-2xl flex items-center justify-center shadow-lg transform active:scale-90 transition-all"><Dices size={24} /></button>
        </div>
      </header>

      <main className="p-4 sm:p-8 space-y-8 max-w-5xl mx-auto">
        
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 px-2 scrollbar-hide snap-x">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTabId(tab.id)} className={cn("snap-start flex flex-col items-center justify-center min-w-[5.5rem] h-24 rounded-[2rem] font-black transition-all border-2", activeTabId === tab.id ? `${tab.bg} ${tab.color} ${tab.accent} shadow-xl scale-105` : "bg-white border-stone-100 text-stone-300")}>
              <div className="mb-2">{tab.icon}</div>
              <span className="text-[9px] uppercase tracking-tighter">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Add Form */}
        <section className={cn("bg-white p-6 sm:p-8 rounded-[2.5rem] space-y-6 border-2 transition-colors", activeTab.accent)}>
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", activeTab.bg, activeTab.color)}>{activeTab.icon}</div>
            <h3 className="text-lg font-black text-brand-primary">Dodaj {activeTab.label}</h3>
          </div>
          <form onSubmit={addActivity} className="flex flex-col sm:flex-row gap-3">
            <input type="text" placeholder="Tytuł / Nazwa" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="flex-1 px-5 py-4 bg-stone-50 border-2 border-transparent focus:border-orange-200 outline-none rounded-2xl font-bold" />
            <button type="submit" className="h-14 px-8 bg-orange-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-orange-600/20 active:scale-95 transition-all">Dodaj teraz</button>
          </form>
        </section>

        {/* List */}
        <div className="grid gap-4">
          <AnimatePresence initial={false}>
            {filteredActivities.map((a) => (
              <motion.div key={a.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white p-5 rounded-[2rem] border-2 border-stone-50 group hover:border-orange-100 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setActivities(prev => prev.map(x => x.id === a.id ? {...x, status: x.status === 'Ukończone' ? 'Do zrobienia' : 'Ukończone'} : x))} className={cn("w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all", a.status === 'Ukończone' ? "bg-emerald-500 border-emerald-500 text-white" : "border-stone-100 text-stone-100")}><Check size={18} /></button>
                    <div>
                      <h4 className={cn("font-black text-brand-primary", a.status === 'Ukończone' && "line-through opacity-40")}>{a.title}</h4>
                      <div className="flex gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button key={star} onClick={() => setActivities(prev => prev.map(x => x.id === a.id ? {...x, rating: star} : x))} className={cn("transition-all", star <= a.rating ? "text-amber-400 fill-amber-400" : "text-stone-100")}><Star size={10} /></button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setActivities(prev => prev.filter(x => x.id !== a.id))} className="text-stone-100 hover:text-red-400 transition-all"><Trash2 size={18} /></button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredActivities.length === 0 && (
            <div className="text-center py-12 opacity-20 border-2 border-dashed border-stone-200 rounded-[2.5rem]">
              <p className="font-black uppercase tracking-widest text-[10px]">Pusto tutaj...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
