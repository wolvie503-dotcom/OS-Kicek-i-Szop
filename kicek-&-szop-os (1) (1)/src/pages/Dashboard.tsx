import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, Battery, Gamepad2, Utensils, 
  Wallet, Package, LogOut, ChevronUp, 
  ChevronDown, Heart, Zap, Coffee,
  Target, Sparkles, CheckCircle2, Circle,
  Trash2, Plus, X, Star, Coins, User, Droplets
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useToasts, ToastContainer } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { useStats } from '../contexts/StatsContext';

type Status = 'Aktywny' | 'Skupienie' | 'Przebodźcowanie' | 'Mało energii';

interface UserState {
  character: 'Kicek' | 'Szop';
  emoji: string;
  battery: number;
  status: Status;
  isOnline: boolean;
}

interface ScheduleItem {
  id: string;
  time: string;
  task: string;
  icon: string;
  completed: boolean;
  assignedTo: 'Kicek' | 'Szop' | 'Razem';
}

interface QuickSignal {
  id: string;
  title: string;
  emoji: string;
}

const statusConfig: Record<Status, { emoji: string, color: string, bg: string, border: string }> = {
  'Aktywny': { emoji: '🌟', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  'Skupienie': { emoji: '🎯', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-100' },
  'Przebodźcowanie': { emoji: '🤯', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-100' },
  'Mało energii': { emoji: '🪫', color: 'text-stone-500', bg: 'bg-stone-50', border: 'border-stone-200' },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toasts, showToast, removeToast } = useToasts();
  const { kicekStats, szopStats, addRewards } = useStats();

  // Date Formatting
  const todayDate = new Date().toLocaleDateString('pl-PL', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  // Determine who the user is from metadata
  const userMetadata = user?.user_metadata || {};
  const currentCharacter = (userMetadata.character === '🦝' ? 'Szop' : 'Kicek') as 'Kicek' | 'Szop';
  const charEmoji = currentCharacter === 'Kicek' ? '🐰' : '🦝';

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

  // Local state
  const [kicek, setKicek] = useState<UserState>(() => getFromStorage('dash_kicek', {
    character: 'Kicek', emoji: '🐰', battery: 85, status: 'Aktywny', isOnline: true
  }));

  const [szop, setSzop] = useState<UserState>(() => getFromStorage('dash_szop', {
    character: 'Szop', emoji: '🦝', battery: 40, status: 'Skupienie', isOnline: true
  }));

  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => getFromStorage('dash_schedule', [
    { id: '1', time: '08:00', task: 'Wspólna kawa', icon: '☕', completed: true, assignedTo: 'Razem' },
    { id: '2', time: '13:00', task: 'Czas skupienia / Praca', icon: '💻', completed: false, assignedTo: 'Razem' },
    { id: '3', time: '18:00', task: 'Spacer lub aktywność', icon: '🌳', completed: false, assignedTo: 'Razem' },
    { id: '4', time: '21:00', task: 'Serial / Odpoczynek', icon: '🍿', completed: false, assignedTo: 'Razem' },
  ]));

  const [quickSignals, setQuickSignals] = useState<QuickSignal[]>(() => getFromStorage('dash_signals', [
    { id: '1', title: 'Chcę Tuli', emoji: '🫂' },
    { id: '2', title: 'Zrób Herbatę', emoji: '🫖' },
    { id: '3', title: 'Poproszę wodę', emoji: '💧' },
    { id: '4', title: 'Gierki?', emoji: '🎮' },
  ]));

  const [notes, setNotes] = useState(() => getFromStorage('app_gratitude_notes', []));

  const [kicekWater, setKicekWater] = useState(() => getFromStorage('dash_kicek_water', {
    current: 0, goal: 8, lastReset: new Date().toLocaleDateString(), rewardClaimed: false
  }));

  const [szopWater, setSzopWater] = useState(() => getFromStorage('dash_szop_water', {
    current: 0, goal: 8, lastReset: new Date().toLocaleDateString(), rewardClaimed: false
  }));

  // Persistence Effects
  React.useEffect(() => saveToStorage('dash_kicek', kicek), [kicek]);
  React.useEffect(() => saveToStorage('dash_szop', szop), [szop]);
  React.useEffect(() => saveToStorage('dash_schedule', schedule), [schedule]);
  React.useEffect(() => saveToStorage('dash_signals', quickSignals), [quickSignals]);
  React.useEffect(() => saveToStorage('dash_kicek_water', kicekWater), [kicekWater]);
  React.useEffect(() => saveToStorage('dash_szop_water', szopWater), [szopWater]);

  // Check for unread gratitude
  React.useEffect(() => {
    const unread = notes.filter((n: any) => n.to === currentCharacter && !n.isRead);
    if (unread.length > 0) {
      showToast(`Masz ${unread.length} nowe podziękowanie! 🙏`, '💝');
    }
  }, []);

  const addWater = (char: 'Kicek' | 'Szop') => {
    const isKicek = char === 'Kicek';
    const state = isKicek ? kicekWater : szopWater;
    const setState = isKicek ? setKicekWater : setSzopWater;
    const nickname = isKicek ? 'Kicek 🐰' : 'Szop 🦝';

    if (state.current >= state.goal) return;

    const newCurrent = state.current + 1;
    setState(prev => ({ ...prev, current: newCurrent }));

    if (newCurrent === state.goal && !state.rewardClaimed) {
      addRewards(nickname as any, 20, 50);
      setState(prev => ({ ...prev, rewardClaimed: true }));
      showToast(`Brawo ${char}! Nawodnienie na 100%! +20💰 +50XP! 💧`, '💰');
    }
  };

  const [newTime, setNewTime] = useState('');
  const [newTask, setNewTask] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('✨');
  const [assignedTo, setAssignedTo] = useState<'Kicek' | 'Szop' | 'Razem'>('Razem');
  const [newSignalTitle, setNewSignalTitle] = useState('');
  const [newSignalEmoji, setNewSignalEmoji] = useState('💬');

  const commonEmojis = ['☕', '🍴', '💻', '🌳', '🍿', '💤', '🫂', '🫖', '🎮', '🚿', '📚', '✨'];
  const currentUser = currentCharacter === 'Kicek' ? kicek : szop;
  const setCurrentUserState = currentCharacter === 'Kicek' ? setKicek : setSzop;

  const updateBattery = (val: number) => {
    setCurrentUserState(prev => ({
      ...prev,
      battery: Math.min(100, Math.max(0, prev.battery + val))
    }));
  };

  const updateStatus = (status: Status) => {
    setCurrentUserState(prev => ({ ...prev, status }));
    showToast(`Status: ${status}`, statusConfig[status].emoji);
  };

  const toggleSchedule = (id: string) => {
    const item = schedule.find(i => i.id === id);
    if (!item) return;
    if (item.assignedTo !== 'Razem' && item.assignedTo !== currentCharacter) {
      showToast(`To zadanie dla: ${item.assignedTo}!`, '⛔');
      return;
    }
    setSchedule(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const addScheduleItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTime || !newTask) return;
    const newItem: ScheduleItem = {
      id: Math.random().toString(36).substr(2, 9),
      time: newTime, task: newTask, icon: selectedEmoji,
      completed: false, assignedTo: assignedTo
    };
    setSchedule(prev => [...prev, newItem].sort((a, b) => a.time.localeCompare(b.time)));
    setNewTime(''); setNewTask(''); setSelectedEmoji('✨'); setAssignedTo('Razem');
    showToast('Dodano do planu!', '📝');
  };

  const deleteScheduleItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSchedule(prev => prev.filter(item => item.id !== id));
    showToast('Usunięto z planu', '🗑️');
  };

  const addQuickSignal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSignalTitle || !newSignalEmoji) return;
    const newSignal: QuickSignal = { id: Math.random().toString(36).substr(2, 9), title: newSignalTitle, emoji: newSignalEmoji };
    setQuickSignals(prev => [...prev, newSignal]);
    setNewSignalTitle(''); setNewSignalEmoji('💬');
    showToast('Dodano sygnał!', '🔔');
  };

  const deleteQuickSignal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickSignals(prev => prev.filter(s => s.id !== id));
    showToast('Usunięto sygnał', '🗑️');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const sendSignal = (actionTitle: string, actionEmoji: string) => {
    showToast(`${currentCharacter} prosi o: ${actionTitle} ${charEmoji}`, actionEmoji);
  };

  const [showCompleted, setShowCompleted] = useState(false);

  const activeSchedule = schedule.filter(item => !item.completed);
  const completedSchedule = schedule.filter(item => item.completed);

  return (
    <div className="min-h-screen bg-[#FDF8F3] pb-40">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <header className="p-6 sm:p-8 flex justify-between items-center max-w-5xl mx-auto w-full">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-4 h-4 text-orange-600 fill-orange-600/10" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-300">Life OS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-primary">
            Witaj, <span className="text-orange-600 italic">{currentCharacter}</span>
          </h1>
        </div>
        <button onClick={handleLogout} className="w-12 h-12 glass-card flex items-center justify-center hover:scale-105 active:scale-95 shadow-lg group">
          <LogOut size={20} className="text-stone-400 group-hover:text-orange-600 transition-colors" />
        </button>
      </header>

      <main className="p-4 sm:p-8 space-y-12 sm:space-y-16 max-w-5xl mx-auto">
        <div className="flex justify-center -mt-8 sm:-mt-12 mb-4">
          <div className="bg-white/50 backdrop-blur-sm border border-white px-5 sm:px-6 py-1.5 sm:py-2 rounded-full shadow-sm">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
              Dzisiaj: <span className="text-orange-600 italic capitalize">{todayDate}</span>
            </span>
          </div>
        </div>

        <section className="space-y-6">
          <h2 className="text-lg sm:text-xl font-black text-brand-primary flex items-center gap-3 px-2">
            <User className="text-orange-500" /> Twoje Profile
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {[kicek, szop].map((u) => {
              const config = statusConfig[u.status];
              const stats = u.character === 'Kicek' ? kicekStats : szopStats;
              const xpNeeded = stats.level * 100;
              const xpProgress = (stats.xp / xpNeeded) * 100;

              return (
                <motion.div 
                  key={u.character}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-6 sm:p-8 glass-card border-none relative overflow-hidden group w-full",
                    u.character === currentCharacter && "ring-4 ring-orange-500/10 border-orange-500/10 border-2"
                  )}
                >
                  {u.character === currentCharacter && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-orange-600 text-white text-[9px] font-black uppercase tracking-widest rounded-bl-xl">Ty</div>
                  )}
                  <div className="flex items-start justify-between mb-6 sm:mb-8 flex-wrap gap-4">
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-stone-100 rounded-2xl sm:rounded-3xl flex items-center justify-center text-4xl sm:text-5xl shadow-inner group-hover:scale-105 transition-transform">{u.emoji}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl sm:text-2xl font-black text-brand-primary">{u.character}</h3>
                          <div className="bg-stone-800 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">LVL {stats.level}</div>
                        </div>
                        <div className="mt-2 space-y-1">
                          <div className="w-24 sm:w-32 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${xpProgress}%` }} className="h-full bg-blue-400 rounded-full" />
                          </div>
                        </div>
                        <div className={cn("badge-status mt-3 scale-90 origin-left", config.bg, config.color, config.border)}>
                          <span>{config.emoji}</span><span>{u.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl border border-amber-100 shadow-sm">
                        <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                        <span className="text-lg sm:text-xl font-black text-amber-600">{stats.gold}</span>
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-stone-300 mt-1">ZŁOTO</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-[9px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-1"><Zap size={10} className="text-orange-500" /> Social Battery</span>
                      <span className="text-lg font-black text-brand-primary">{u.battery}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden p-0.5">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${u.battery}%` }} className={cn("h-full rounded-full transition-all duration-1000", u.battery > 70 ? "bg-emerald-500" : u.battery > 30 ? "bg-orange-500" : "bg-red-500")} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-lg sm:text-xl font-black text-brand-primary flex items-center gap-3 px-2">
            <Battery className="text-orange-500" /> Stan Energii
          </h2>
          <div className="glass-card p-6 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 w-full">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-300">Moja Energia</h4>
              <div className="flex items-center gap-3 sm:gap-4">
                <button onClick={() => updateBattery(-10)} className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-400 hover:text-orange-600 transition-all active:scale-95"><ChevronDown size={28} /></button>
                <div className="flex-1 text-center py-3 sm:py-4 bg-stone-50 rounded-2xl border border-stone-100 font-black text-2xl sm:text-4xl text-brand-primary">{currentUser.battery}%</div>
                <button onClick={() => updateBattery(10)} className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center text-stone-400 hover:text-orange-600 transition-all active:scale-95"><ChevronUp size={28} /></button>
              </div>
            </div>
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-300">Moja Aktywność</h4>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {(Object.keys(statusConfig) as Status[]).map((s) => (
                  <button key={s} onClick={() => updateStatus(s)} className={cn("flex items-center gap-2 sm:gap-3 px-3 py-3 sm:px-4 sm:py-3.5 rounded-xl sm:rounded-2xl border-2 transition-all font-bold text-[11px] sm:text-sm", currentUser.status === s ? "bg-orange-50 border-orange-500 text-orange-600 shadow-sm" : "bg-white border-stone-50 text-stone-400 hover:border-stone-200")}>
                    <span className="text-sm sm:text-base">{statusConfig[s].emoji}</span><span>{s}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-lg sm:text-xl font-black text-brand-primary flex items-center gap-3 px-2">
            <Droplets className="text-blue-500" /> Nawodnienie
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {[ { label: 'Kicek', state: kicekWater, setState: setKicekWater, emoji: '🐰' }, { label: 'Szop', state: szopWater, setState: setSzopWater, emoji: '🦝' } ].map((waterUser) => (
              <div key={waterUser.label} className="bg-blue-50/40 p-6 sm:p-8 rounded-[2.5rem] sm:rounded-[3rem] border border-blue-100/50 space-y-6">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl">{waterUser.emoji}</span>
                    <h3 className="text-base sm:text-lg font-black text-brand-primary">{waterUser.label}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => waterUser.setState(prev => ({ ...prev, goal: Math.max(5, prev.goal - 1) }))} className="w-7 h-7 rounded-full border border-stone-200 flex items-center justify-center text-stone-400">-</button>
                    <span className="text-[9px] font-black text-stone-400">Cel: {waterUser.state.goal}</span>
                    <button onClick={() => waterUser.setState(prev => ({ ...prev, goal: Math.min(12, prev.goal + 1) }))} className="w-7 h-7 rounded-full border border-stone-200 flex items-center justify-center text-stone-400">+</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {Array.from({ length: waterUser.state.goal }).map((_, i) => (
                    <motion.div key={i} animate={{ scale: i < waterUser.state.current ? 1.05 : 1 }} className={cn("w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center border-2 shrink-0 shadow-sm", i < waterUser.state.current ? "bg-blue-500 border-blue-600 text-white" : "bg-white border-stone-100 text-stone-200")}>
                      <Droplets size={18} fill={i < waterUser.state.current ? "white" : "none"} />
                    </motion.div>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <span className="text-[9px] font-black uppercase text-stone-400 tracking-wider">Wypito</span>
                    <div className="text-xl sm:text-2xl font-black text-brand-primary">{waterUser.state.current}/{waterUser.state.goal} <span className="text-xs text-stone-300">szkl.</span></div>
                  </div>
                  <button onClick={() => addWater(waterUser.label as any)} disabled={waterUser.state.current >= waterUser.state.goal} className="px-5 py-3 sm:px-6 sm:py-4 bg-blue-600 text-white font-black rounded-xl sm:rounded-2xl transition-all shadow-lg active:scale-95 disabled:bg-stone-200 flex items-center gap-2 text-sm sm:text-base">
                    <Plus size={18} /><span>DODAJ 💧</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-lg sm:text-xl font-black text-brand-primary flex items-center gap-3 px-2">
            <Sparkles className="text-amber-500" /> Szybkie Sygnały
          </h2>
          <div className="glass-card p-6 sm:p-10 space-y-8 sm:space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <AnimatePresence initial={false}>
                {quickSignals.map((signal) => (
                  <motion.div key={signal.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative group">
                    <button onClick={() => sendSignal(signal.title, signal.emoji)} className="w-full p-5 sm:p-6 bg-stone-50 hover:bg-orange-50 border-2 border-stone-50 hover:border-orange-200 rounded-[1.5rem] sm:rounded-[2rem] transition-all flex items-center gap-4 font-bold text-brand-primary active:scale-95">
                      <span className="text-2xl sm:text-3xl group-hover:rotate-6 transition-transform">{signal.emoji}</span>
                      <span className="text-base sm:text-lg text-left">{signal.title}</span>
                    </button>
                    <button onClick={(e) => deleteQuickSignal(signal.id, e)} className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-white border border-stone-100 text-stone-300 opacity-0 group-hover:opacity-100 flex items-center justify-center hover:text-red-500 transition-opacity"><X size={14} /></button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <form onSubmit={addQuickSignal} className="pt-6 border-t border-stone-100 flex flex-col sm:flex-row gap-3">
              <input type="text" placeholder="💆 Masaż?" value={newSignalTitle} onChange={(e) => setNewSignalTitle(e.target.value)} className="flex-1 px-5 py-3 bg-[#FFF9F2] border-2 border-orange-50 focus:border-orange-200 outline-none rounded-2xl font-bold text-brand-primary text-base" />
              <input type="text" placeholder="Emoji" maxLength={2} value={newSignalEmoji} onChange={(e) => setNewSignalEmoji(e.target.value)} className="w-full sm:w-20 px-3 py-3 bg-[#FFF9F2] border-2 border-orange-50 rounded-2xl text-center text-xl text-base" />
              <button type="submit" className="px-6 py-4 sm:py-3 bg-stone-800 text-white font-black rounded-2xl transition-all shadow active:scale-95 flex items-center justify-center gap-2 text-xs uppercase tracking-widest"><Plus size={18} /><span>Dodaj</span></button>
            </form>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-lg sm:text-xl font-black text-brand-primary flex items-center gap-3 px-2">
            <Target className="text-orange-500" /> Plan Dnia
          </h2>
          <div className="space-y-8">
            <form onSubmit={addScheduleItem} className="space-y-4 p-6 sm:p-10 bg-white rounded-[2.5rem] sm:rounded-[3.5rem] border-2 border-stone-50 shadow-xl shadow-stone-900/5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-stone-300 px-2 tracking-widest">Godzina</label>
                  <input type="text" placeholder="12:00" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="w-full px-5 py-4 bg-stone-50 border-2 border-transparent focus:border-orange-200 outline-none rounded-2xl font-black text-brand-primary text-lg" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-stone-300 px-2 tracking-widest">Co robimy?</label>
                  <input type="text" placeholder="Zadanie..." value={newTask} onChange={(e) => setNewTask(e.target.value)} className="w-full px-5 py-4 bg-stone-50 border-2 border-transparent focus:border-orange-200 outline-none rounded-2xl font-black text-brand-primary text-lg sm:col-span-1" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-stone-300 px-2 tracking-widest">Dla kogo?</label>
                  <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value as any)} className="w-full px-5 py-4 bg-stone-50 border-2 border-transparent focus:border-orange-200 outline-none rounded-2xl font-black text-brand-primary text-lg appearance-none">
                    <option value="Razem">👫 Razem</option>
                    <option value="Kicek">🐰 Kicek</option>
                    <option value="Szop">🦝 Szop</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pb-2 pt-2">
                {commonEmojis.map(emoji => (
                  <button key={emoji} type="button" onClick={() => setSelectedEmoji(emoji)} className={cn("w-12 h-12 flex items-center justify-center text-2xl rounded-2xl border-2 transition-all shrink-0", selectedEmoji === emoji ? "bg-orange-50 border-orange-400 scale-110 shadow-md" : "bg-white border-stone-100 hover:border-orange-100")}>{emoji}</button>
                ))}
              </div>
              <button type="submit" className="w-full py-5 bg-orange-600 text-white font-black rounded-2xl sm:rounded-[2.5rem] transition-all shadow-xl shadow-orange-600/20 active:scale-[0.98] flex items-center justify-center gap-3 text-lg uppercase tracking-wider mt-4"><Plus size={24} /><span>Zaplanuj</span></button>
            </form>

            <div className="grid gap-6">
              <AnimatePresence initial={false}>
                {activeSchedule.map((item) => {
                  const bgClass = item.assignedTo === 'Kicek' ? 'bg-sky-50' : item.assignedTo === 'Szop' ? 'bg-orange-50' : 'bg-brand-primary/5';
                  const accentColor = item.assignedTo === 'Kicek' ? 'text-sky-600' : item.assignedTo === 'Szop' ? 'text-orange-600' : 'text-brand-primary';

                  return (
                    <motion.div 
                      key={item.id} 
                      layout 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={cn(
                        "w-full bg-white rounded-[2rem] sm:rounded-[3rem] border-2 border-stone-50 shadow-xl shadow-stone-900/5 group overflow-hidden relative",
                        "flex flex-col sm:flex-row"
                      )}
                    >
                      {/* Left Side: Time and Info */}
                      <div className={cn("p-6 sm:p-8 flex-1 flex flex-col justify-between gap-4", bgClass)}>
                        <div className="flex items-start justify-between">
                          <div className="flex flex-col">
                            <span className="text-4xl sm:text-5xl font-black text-brand-primary tracking-tighter flex items-center gap-2">
                              {item.time}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={cn("text-[10px] font-black uppercase tracking-widest", accentColor)}>
                                {item.assignedTo === 'Kicek' ? '🐰 Kicek' : item.assignedTo === 'Szop' ? '🦝 Szop' : '👫 Razem'}
                              </span>
                            </div>
                          </div>
                          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                            {item.icon}
                          </div>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-brand-primary leading-tight line-clamp-2">
                          {item.task}
                        </h3>
                      </div>

                      {/* Right Side: Actions */}
                      <div className="p-4 sm:p-8 bg-white flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-4 sm:min-w-[180px] border-t sm:border-t-0 sm:border-l border-stone-100">
                        <button 
                          onClick={() => toggleSchedule(item.id)}
                          className={cn(
                            "flex-1 sm:w-full h-14 sm:h-16 rounded-2xl sm:rounded-3xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all active:scale-95",
                            "bg-stone-800 text-white shadow-lg shadow-stone-900/20"
                          )}
                        >
                          <span>Gotowe</span> <CheckCircle2 size={20} />
                        </button>
                        <button onClick={(e) => deleteScheduleItem(item.id, e)} className="w-14 h-14 sm:h-auto sm:w-full py-0 sm:py-3 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                          <Trash2 size={24} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {activeSchedule.length === 0 && (
                <div className="text-center py-20 opacity-30">
                  <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles size={40} className="text-stone-400" />
                  </div>
                  <p className="font-black uppercase tracking-widest text-xs italic">Czysta karta! Czas coś zaplanować...</p>
                </div>
              )}

              {/* Completed Section Toggle */}
              {completedSchedule.length > 0 && (
                <div className="mt-8">
                  <button 
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="flex items-center gap-3 text-stone-400 font-black uppercase text-[10px] tracking-[0.3em] hover:text-orange-600 transition-colors mx-auto px-6 py-3"
                  >
                    {showCompleted ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    <span>Zakończone ({completedSchedule.length})</span>
                  </button>
                  
                  <AnimatePresence>
                    {showCompleted && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-4 pt-6"
                      >
                        {completedSchedule.map(item => (
                          <div key={item.id} className="flex items-center justify-between p-5 bg-stone-100/50 rounded-3xl border border-stone-200/50 opacity-60">
                             <div className="flex items-center gap-5">
                                <span className="text-xs font-black text-stone-400 w-12">{item.time}</span>
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl grayscale">{item.icon}</div>
                                <span className="font-bold text-stone-500 line-through">{item.task}</span>
                             </div>
                             <button onClick={() => toggleSchedule(item.id)} className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                <CheckCircle2 size={18} />
                             </button>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-lg sm:text-xl font-black text-brand-primary flex items-center gap-3"><Heart className="text-rose-500 fill-rose-500" /> Ściana Wdzięczności</h2>
            <button onClick={() => navigate('/gratitude')} className="text-[9px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600">Zobacz wszystko</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {notes.slice(0, 3).map((note: any, i: number) => (
              <motion.div key={note.id} initial={{ opacity: 0, scale: 0.95, rotate: i % 2 === 0 ? -0.5 : 0.5 }} animate={{ opacity: 1, scale: 1 }} className={cn("p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-2 shadow-sm min-h-[140px] flex flex-col justify-between italic", note.color)}>
                <p className="text-sm font-medium line-clamp-4">"{note.content}"</p>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-40 mt-4 text-right">Od: {note.from}</span>
              </motion.div>
            ))}
            {notes.length === 0 && (
              <div className="col-span-full py-10 bg-white rounded-[2rem] border-2 border-stone-50 text-center opacity-50 italic font-bold text-stone-400 text-sm">Brak nowych podziękowań. Czas kogoś docenić! ❤️</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
