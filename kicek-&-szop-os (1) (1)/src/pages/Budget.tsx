import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, Target, Gamepad2, Utensils, 
  Wallet, Package, LogOut, CheckCircle2, 
  Plus, Minus, Trash2, X, Save, TrendingUp, 
  TrendingDown, CreditCard, Calendar, 
  Coins, User, Clock, ChevronRight,
  Settings, Info, History, Edit2, Check, Heart,
  Sparkles, Banknote
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useToasts, ToastContainer } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';

type Person = 'Kicek 🐰' | 'Szop 🦝';
type ExpenseCategory = 'Jedzenie' | 'Rozrywka' | 'Inne';

interface TutoringSession {
  id: string;
  person: Person;
  studentName: string;
  hours: number;
  rate: number;
  isPaid: boolean;
  date: string;
}

interface Expense {
  id: string;
  name: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
}

interface Subscription {
  id: string;
  name: string;
  amount: number;
  paymentDay: number;
  type: 'subscription' | 'installment';
}

interface MonthHistory {
  month: string; // YYYY-MM
  kicekTutoring: number;
  szopTutoring: number;
  expenses: number;
  savings: number;
}

export default function Budget() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { toasts, showToast, removeToast } = useToasts();

  // --- PERSISTENCE HELPERS ---
  const getFromStorage = <T,>(key: string, defaultValue: T): T => {
    const saved = localStorage.getItem(key);
    if (!saved) return defaultValue;
    try { return JSON.parse(saved); } catch { return defaultValue; }
  };

  const saveToStorage = (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  // --- STATE ---
  const [sessions, setSessions] = useState<TutoringSession[]>(() => 
    getFromStorage('budget_sessions', [])
  );

  const [expenses, setExpenses] = useState<Expense[]>(() => 
    getFromStorage('budget_expenses', [])
  );

  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => 
    getFromStorage('budget_subscriptions', [])
  );

  const [history, setHistory] = useState<MonthHistory[]>(() => 
    getFromStorage('budget_history', [])
  );

  const [monthlyLimit, setMonthlyLimit] = useState<number>(() => getFromStorage('budget_limit', 3000));
  const [currentMonth, setCurrentMonth] = useState(() => getFromStorage('budget_current_month', new Date().toISOString().slice(0, 7)));
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);

  // Persistence Effects
  useEffect(() => saveToStorage('budget_sessions', sessions), [sessions]);
  useEffect(() => saveToStorage('budget_expenses', expenses), [expenses]);
  useEffect(() => saveToStorage('budget_subscriptions', subscriptions), [subscriptions]);
  useEffect(() => saveToStorage('budget_limit', monthlyLimit), [monthlyLimit]);
  useEffect(() => saveToStorage('budget_history', history), [history]);
  useEffect(() => saveToStorage('budget_current_month', currentMonth), [currentMonth]);

  // --- CALCULATIONS ---
  const totalTutoringEarned = useMemo(() => 
    sessions.filter(s => s.isPaid).reduce((acc, s) => acc + s.hours * s.rate, 0), 
    [sessions]
  );
  
  const totalSubscriptions = useMemo(() => 
    subscriptions.reduce((acc, s) => acc + s.amount, 0),
    [subscriptions]
  );

  const totalOut = useMemo(() => 
    expenses.reduce((acc, e) => acc + e.amount, 0) + totalSubscriptions, 
    [expenses, totalSubscriptions]
  );

  // --- MONTHLY RESET LOGIC ---
  useEffect(() => {
    const actualMonth = new Date().toISOString().slice(0, 7);
    if (actualMonth !== currentMonth) {
      // 1. Prepare historical summary
      const kicekEarned = sessions.filter(s => s.person === 'Kicek 🐰' && s.isPaid).reduce((acc, s) => acc + s.hours * s.rate, 0);
      const szopEarned = sessions.filter(s => s.person === 'Szop 🦝' && s.isPaid).reduce((acc, s) => acc + s.hours * s.rate, 0);
      const expenseSum = expenses.reduce((acc, e) => acc + e.amount, 0) + totalSubscriptions;
      
      const newArchiveEntry: MonthHistory = {
        month: currentMonth,
        kicekTutoring: kicekEarned,
        szopTutoring: szopEarned,
        expenses: expenseSum,
        savings: (kicekEarned + szopEarned) - expenseSum
      };

      // 2. Perform Migration
      setHistory(prev => [newArchiveEntry, ...prev]);
      
      // INTELLIGENT RESET: Keep students, set hours to 0
      setSessions(prev => prev.map(s => ({ ...s, hours: 0, isPaid: false })));
      
      // CLEAR EXPENSES: Fresh start for groceries/fun
      setExpenses([]);
      
      // UPDATE MONTH
      setCurrentMonth(actualMonth);
      
      showToast(`Miesiąc ${currentMonth} zakończony. Nowy start na ${actualMonth}!`, '🚀');
    }
  }, [currentMonth, sessions, expenses, totalSubscriptions, showToast]);

  // --- ACTIONS ---
  const updateStudentHours = (id: string, delta: number) => {
    setSessions(prev => prev.map(s => {
      if (s.id === id) {
        const newHours = Math.max(0, s.hours + delta);
        return { ...s, hours: newHours };
      }
      return s;
    }));
  };

  const updateStudentRate = (id: string, newRate: number) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, rate: newRate } : s));
  };

  const togglePaid = (id: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, isPaid: !s.isPaid } : s));
  };

  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    showToast('Usunięto lekcję', '🗑️');
  };

  const progress = Math.min(100, (totalOut / monthlyLimit) * 100);

  // --- FORMS ---
  const [newSession, setNewSession] = useState<{ person: Person; student: string; hours: number; rate: number }>({ person: 'Kicek 🐰', student: '', hours: 1, rate: 80 });
  const [newExpense, setNewExpense] = useState<{ name: string; amount: number; category: ExpenseCategory }>({ name: '', amount: 0, category: 'Jedzenie' });
  const [newSub, setNewSub] = useState<{ name: string; amount: number; paymentDay: number; type: 'subscription' | 'installment' }>({ name: '', amount: 0, paymentDay: 1, type: 'subscription' });

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSession.student) return;
    const session: TutoringSession = { 
      id: Date.now().toString(), 
      person: newSession.person, 
      studentName: newSession.student, 
      hours: newSession.hours, 
      rate: newSession.rate, 
      isPaid: false, 
      date: new Date().toISOString() 
    };
    setSessions(prev => [session, ...prev]);
    setNewSession({ ...newSession, student: '', hours: 1 });
    showToast(`Uczeń dodany!`, '🎓');
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.name || newExpense.amount <= 0) return;
    const expense: Expense = { 
      id: Date.now().toString(), 
      name: newExpense.name, 
      amount: newExpense.amount, 
      category: newExpense.category, 
      date: new Date().toISOString() 
    };
    setExpenses(prev => [expense, ...prev]);
    setNewExpense({ name: '', amount: 0, category: 'Jedzenie' });
    showToast(`Wydatek dodany!`, '💸');
  };

  const handleAddSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSub.name || newSub.amount <= 0) return;
    const sub: Subscription = {
      id: Date.now().toString(),
      name: newSub.name,
      amount: newSub.amount,
      paymentDay: newSub.paymentDay,
      type: newSub.type
    };
    setSubscriptions(prev => [sub, ...prev]);
    setNewSub({ name: '', amount: 0, paymentDay: 1, type: 'subscription' });
    showToast(`Dodano ${newSub.type === 'subscription' ? 'subskrypcję' : 'ratę'}!`, '💳');
  };

  return (
    <div className="min-h-screen bg-[#FDF8F3] pb-40">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <header className="p-4 sm:p-8 flex justify-between items-center max-w-6xl mx-auto w-full">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-5 h-5 text-amber-600" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300">BUDŻET</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-primary">Miesięczny <span className="text-amber-600 italic">Skarbiec</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowHistoryModal(true)}
            className="p-3 bg-white rounded-2xl border-2 border-stone-50 text-stone-400 hover:text-brand-primary hover:border-amber-100 transition-all shadow-sm"
          >
            <History size={20} />
          </button>
          <div className="text-right">
               <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">{currentMonth}</p>
          </div>
        </div>
      </header>

      <main className="p-3 sm:p-8 space-y-6 sm:space-y-12 max-w-6xl mx-auto">
        
        {/* Limit Tracker */}
        <section className="bg-white rounded-[2.5rem] p-6 sm:p-10 border-2 border-stone-100 shadow-xl shadow-amber-900/5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
            <div className="space-y-1">
               <h2 className="text-xl font-black text-stone-300 uppercase tracking-tight text-sm sm:text-xl">Limit Miesięczny</h2>
               <div className="flex items-center gap-3">
                 {isEditingLimit ? (
                    <input type="number" value={monthlyLimit} onChange={e => setMonthlyLimit(parseInt(e.target.value) || 0)} onBlur={() => setIsEditingLimit(false)} autoFocus className="text-2xl sm:text-3xl font-black text-brand-primary w-28 sm:w-32 bg-stone-50 rounded-xl px-2 ring-2 ring-amber-400 outline-none" />
                 ) : (
                    <p className="text-2xl sm:text-3xl font-black text-brand-primary">{monthlyLimit} zł</p>
                 )}
                 <button onClick={() => setIsEditingLimit(!isEditingLimit)} className="p-2 bg-stone-50 rounded-lg text-stone-400"><Edit2 size={16} /></button>
               </div>
            </div>
            <div className="text-left sm:text-right">
               <p className="text-[10px] font-black text-stone-300 uppercase">Pozostało</p>
               <p className={cn("text-xl sm:text-2xl font-black", monthlyLimit - totalOut > 0 ? "text-emerald-500" : "text-red-500")}>{Math.round(monthlyLimit - totalOut)} zł</p>
            </div>
          </div>
          <div className="h-4 bg-stone-100 rounded-full overflow-hidden">
             <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className={cn("h-full rounded-full transition-all", progress > 90 ? "bg-red-500" : "bg-amber-500")} />
          </div>
        </section>

        {/* Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
           <div className="bg-emerald-50 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] text-center border-2 border-emerald-100 flex flex-col justify-center shadow-lg shadow-emerald-500/5">
              <p className="text-[8px] sm:text-[9px] font-black text-emerald-300 uppercase tracking-widest mb-1">Wpływy</p>
              <p className="text-base sm:text-xl font-black text-emerald-600">+{totalTutoringEarned} zł</p>
           </div>
           <div className="bg-red-50 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] text-center border-2 border-red-100 flex flex-col justify-center shadow-lg shadow-red-500/5">
              <p className="text-[8px] sm:text-[9px] font-black text-red-300 uppercase tracking-widest mb-1">Wypływy</p>
              <p className="text-base sm:text-xl font-black text-red-600">-{totalOut} zł</p>
           </div>
           <div className="col-span-2 md:col-span-1 bg-brand-primary p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] text-center text-white flex flex-col justify-center shadow-xl shadow-stone-900/20 ring-4 ring-white/50">
              <p className="text-[8px] sm:text-[9px] font-black text-white/50 uppercase tracking-widest mb-1">Saldo</p>
              <p className="text-xl sm:text-2xl font-black">{(totalTutoringEarned - totalOut).toFixed(0)} zł</p>
           </div>
        </div>

        {/* Tutoring */}
        <section className="space-y-6">
           <div className="flex items-center justify-between px-2">
             <h3 className="text-lg font-black text-brand-primary uppercase flex items-center gap-3">
               <Sparkles className="text-amber-500" size={20} /> Korepetycje
             </h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['Kicek 🐰', 'Szop 🦝'].map(p => (
                <div key={p} className="bg-white p-5 sm:p-8 rounded-[2.5rem] sm:rounded-[3rem] border-2 border-stone-50 space-y-6 shadow-xl shadow-stone-900/5">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-stone-50 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-inner">{p.includes('Kicek') ? '🐰' : '🦝'}</div>
                        <span className="font-black text-brand-primary text-xl">{p.split(' ')[0]}</span>
                      </div>
                      <div className="text-right">
                         <p className="text-[9px] font-black text-stone-300 uppercase">Zarobek</p>
                         <p className="text-lg font-black text-emerald-600">
                           {sessions.filter(s => s.person === p && s.isPaid).reduce((acc, s) => acc + s.hours * s.rate, 0)} zł
                         </p>
                      </div>
                   </div>
                   
                   <div className="space-y-4">
                      {sessions.filter(s => s.person === p).map(s => (
                        <div key={s.id} className="flex flex-col gap-4 p-4 sm:p-5 bg-stone-50/50 rounded-[2rem] border border-stone-100 hover:border-amber-200 transition-all group">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                 <button onClick={() => togglePaid(s.id)} className={cn("w-7 h-7 rounded-full border-2 transition-all active:scale-90", s.isPaid ? "bg-emerald-500 border-emerald-500 text-white flex items-center justify-center" : "border-stone-200 bg-white")}>
                                    {s.isPaid && <Check size={16} />}
                                 </button>
                                 <span className="font-bold text-brand-primary text-sm sm:text-base">{s.studentName}</span>
                              </div>
                              <button onClick={() => deleteSession(s.id)} className="text-stone-300 hover:text-red-500 sm:opacity-0 group-hover:opacity-100 transition-all">
                                 <Trash2 size={18} />
                              </button>
                           </div>

                           <div className="flex items-center justify-between pt-3 border-t border-stone-100 flex-wrap gap-4">
                              <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-stone-100 shadow-sm grow sm:grow-0">
                                 <button onClick={() => updateStudentHours(s.id, -1)} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-stone-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg sm:rounded-xl transition-all active:scale-95">
                                    <Minus size={18} />
                                 </button>
                                 <div className="px-3 sm:px-5 flex flex-col items-center">
                                    <span className="text-[8px] font-black text-stone-300 uppercase tracking-tighter mb-0.5">Godziny</span>
                                    <span className="text-sm sm:text-base font-black text-brand-primary">{s.hours}</span>
                                 </div>
                                 <button onClick={() => updateStudentHours(s.id, 1)} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-stone-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg sm:rounded-xl transition-all active:scale-95">
                                    <Plus size={18} />
                                 </button>
                              </div>

                              <div className="flex items-center gap-4 sm:gap-6 ml-auto">
                                <div className="text-right">
                                  <div className="flex items-center gap-2 justify-end mb-0.5">
                                    <span className="text-[8px] font-black text-stone-300 uppercase tracking-tighter">Stawka</span>
                                    <button onClick={() => setEditingRateId(editingRateId === s.id ? null : s.id)} className="text-stone-300 hover:text-amber-500 transition-colors">
                                      {editingRateId === s.id ? <Check size={10} /> : <Edit2 size={10} />}
                                    </button>
                                  </div>
                                  {editingRateId === s.id ? (
                                    <input 
                                      type="number" 
                                      value={s.rate} 
                                      onChange={(e) => updateStudentRate(s.id, parseInt(e.target.value) || 0)}
                                      onBlur={() => setEditingRateId(null)}
                                      autoFocus
                                      className="w-16 h-8 bg-white border border-amber-200 rounded-lg px-2 text-right font-black text-amber-600 focus:outline-none text-xs"
                                    />
                                  ) : (
                                    <p className="text-[10px] sm:text-xs font-black text-stone-400">{s.rate} zł</p>
                                  )}
                                </div>
                                <div className="text-right">
                                   <p className="text-[8px] font-black text-stone-300 uppercase mb-0.5 tracking-tighter">Suma</p>
                                   <p className={cn("text-base sm:text-lg font-black", s.isPaid ? "text-emerald-500" : "text-stone-400")}>{s.hours * s.rate} zł</p>
                                </div>
                              </div>
                           </div>
                        </div>
                      ))}
                      {sessions.filter(s => s.person === p).length === 0 && (
                        <div className="text-center py-6 border-2 border-dashed border-stone-100 rounded-[2rem] opacity-20">
                          <p className="text-[10px] font-black uppercase tracking-widest">Brak uczniów</p>
                        </div>
                      )}
                   </div>
                </div>
              ))}
           </div>
           
           <form onSubmit={handleAddSession} className="bg-white p-6 sm:p-8 rounded-[2.5rem] border-2 border-orange-50 shadow-lg shadow-orange-900/5 grid grid-cols-1 sm:grid-cols-5 gap-4">
              <div className="sm:col-span-1">
                <label className="text-[10px] font-black uppercase text-stone-300 px-2 tracking-widest block mb-1">Osoba</label>
                <select value={newSession.person} onChange={e => setNewSession({...newSession, person: e.target.value as Person})} className="w-full h-14 px-5 rounded-2xl font-black bg-stone-50 outline-none border-2 border-transparent focus:border-orange-200 text-sm">
                  <option value="Kicek 🐰">🐰 Kicek</option>
                  <option value="Szop 🦝">🦝 Szop</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-black uppercase text-stone-300 px-2 tracking-widest block mb-1">Uczeń</label>
                <input type="text" placeholder="Imię i nazwisko" value={newSession.student} onChange={e => setNewSession({...newSession, student: e.target.value})} className="w-full h-14 px-5 rounded-2xl font-black bg-stone-50 outline-none border-2 border-transparent focus:border-orange-200 text-sm" />
              </div>
              <div className="sm:col-span-1">
                <label className="text-[10px] font-black uppercase text-stone-300 px-2 tracking-widest block mb-1">Stawka (zł)</label>
                <div className="relative">
                  <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                  <input type="number" placeholder="80" value={newSession.rate || ''} onChange={e => setNewSession({...newSession, rate: parseInt(e.target.value) || 0})} className="w-full h-14 pl-12 pr-5 rounded-2xl font-black bg-stone-50 outline-none border-2 border-transparent focus:border-orange-200 text-sm" />
                </div>
              </div>
              <div className="flex items-end">
                <button type="submit" className="w-full h-14 bg-orange-600 text-white font-black rounded-2xl uppercase text-[11px] tracking-[0.2em] shadow-lg shadow-orange-600/20 active:scale-95 transition-all">Dodaj</button>
              </div>
           </form>
        </section>

        {/* Expenses */}
        <section className="space-y-4 pt-4 sm:pt-6">
           <div className="flex items-center justify-between px-2">
             <h3 className="text-base sm:text-lg font-black text-brand-primary uppercase">Wydatki Bieżące</h3>
             <TrendingDown className="text-red-400 w-5 h-5 sm:w-6 sm:h-6" />
           </div>
           <div className="bg-white rounded-[2.5rem] sm:rounded-[3rem] border-2 border-stone-50 overflow-hidden shadow-lg shadow-stone-900/5">
              <div className="p-3 sm:p-8 space-y-1 max-h-[400px] overflow-y-auto scrollbar-hide">
                 {expenses.map(e => (
                   <motion.div key={e.id} layout className="flex justify-between items-center py-2.5 px-3 sm:p-4 hover:bg-stone-50 transition-colors border-b border-stone-50 last:border-0 text-[14px]">
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                         <div className="w-9 h-9 sm:w-12 sm:h-12 bg-stone-50 rounded-xl flex items-center justify-center text-base sm:text-xl shrink-0">
                           {e.category === 'Jedzenie' ? '🍔' : e.category === 'Rozrywka' ? '🎮' : '📦'}
                         </div>
                         <div className="min-w-0 flex-1">
                            <span className="font-bold text-brand-primary block truncate">{e.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black uppercase text-stone-200 tracking-widest">{new Date(e.date).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })}</span>
                              <span className="text-[9px] font-black uppercase text-stone-300 tracking-widest sm:hidden">• {e.category}</span>
                            </div>
                         </div>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-6 ml-3">
                         <span className="font-black text-red-500 text-sm sm:text-lg whitespace-nowrap">-{e.amount} zł</span>
                         <button onClick={() => setExpenses(prev => prev.filter(x => x.id !== e.id))} className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl text-stone-200 hover:text-red-500 transition-all flex items-center justify-center">
                            <Trash2 size={16} />
                         </button>
                      </div>
                   </motion.div>
                 ))}
                 {expenses.length === 0 && (
                   <div className="text-center py-12 opacity-20">
                      <p className="font-black uppercase tracking-widest text-[10px]">Brak wydatków w tym miesiącu</p>
                   </div>
                 )}
              </div>
              
              {/* Desktop Form (Hidden on small screens) */}
              <form onSubmit={handleAddExpense} className="hidden sm:grid p-6 sm:p-8 bg-stone-50/50 grid-cols-1 sm:grid-cols-4 gap-4 border-t border-stone-100">
                 <div className="sm:col-span-2">
                    <input type="text" placeholder="Co kupiono?" value={newExpense.name} onChange={e => setNewExpense({...newExpense, name: e.target.value})} className="w-full h-14 px-6 rounded-2xl bg-white font-black outline-none border-2 border-transparent focus:border-stone-200" />
                 </div>
                 <div className="sm:col-span-1">
                    <input type="number" placeholder="Ile?" value={newExpense.amount || ''} onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value) || 0})} className="w-full h-14 px-6 rounded-2xl bg-white font-black outline-none border-2 border-transparent focus:border-stone-200" />
                 </div>
                 <button type="submit" className="h-14 bg-stone-800 text-white font-black rounded-2xl uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-stone-900/10 active:scale-95 transition-all">Dodaj wydatek</button>
              </form>
           </div>
        </section>

        {/* Mobile Floating Action Button for Expenses */}
        <button 
          onClick={() => setShowAddExpenseModal(true)} 
          className="fixed bottom-24 right-6 w-16 h-16 bg-brand-primary text-white rounded-full sm:hidden shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-transform ring-4 ring-white"
        >
          <Plus size={32} />
        </button>

        {/* Mobile Add Expense Modal */}
        <AnimatePresence>
          {showAddExpenseModal && (
            <div className="fixed inset-0 z-[110] flex items-end sm:hidden">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddExpenseModal(false)} className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" />
              <motion.div 
                initial={{ y: "100%" }} 
                animate={{ y: 0 }} 
                exit={{ y: "100%" }} 
                className="relative w-full bg-white rounded-t-[3rem] p-8 pb-12 shadow-2xl space-y-6"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-black text-brand-primary uppercase">Nowy Wydatek</h3>
                  <button onClick={() => setShowAddExpenseModal(false)} className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-400"><X size={20}/></button>
                </div>
                <form onSubmit={(e) => { handleAddExpense(e); setShowAddExpenseModal(false); }} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-stone-300 uppercase px-2 tracking-widest">Co kupiono?</label>
                    <input type="text" placeholder="Np. Zakupy spożywcze" value={newExpense.name} onChange={e => setNewExpense({...newExpense, name: e.target.value})} className="w-full h-14 px-6 rounded-2xl bg-stone-50 font-black outline-none border-2 border-transparent focus:border-amber-200" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-stone-300 uppercase px-2 tracking-widest">Kwota (zł)</label>
                      <input type="number" placeholder="0.00" value={newExpense.amount || ''} onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value) || 0})} className="w-full h-14 px-6 rounded-2xl bg-stone-50 font-black outline-none border-2 border-transparent focus:border-amber-200" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-stone-300 uppercase px-2 tracking-widest">Kategoria</label>
                      <select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value as ExpenseCategory})} className="w-full h-14 px-4 rounded-2xl bg-stone-50 font-black outline-none border-2 border-transparent focus:border-amber-200">
                        <option value="Jedzenie">🍔 Jedzenie</option>
                        <option value="Rozrywka">🎮 Rozrywka</option>
                        <option value="Inne">📦 Inne</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="w-full h-16 bg-brand-primary text-white font-black rounded-2xl uppercase tracking-widest shadow-xl shadow-stone-900/20 active:scale-95 transition-all mt-4">Płacę i dodaję</button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Subscriptions & Installments */}
        <section className="space-y-6 pt-6">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-2">
             <h3 className="text-lg font-black text-brand-primary uppercase flex items-center gap-2">
               <CreditCard className="text-blue-500" size={20} /> Koszty Stałe
             </h3>
             <div className="bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
               <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">
                 Suma: <span className="text-sm">{totalSubscriptions} zł</span> /mies
               </p>
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Subscriptions */}
             <div className="space-y-4">
               <div className="px-2 flex items-center justify-between">
                 <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Subskrypcje</h4>
                 <Plus size={14} className="text-stone-300" />
               </div>
               <div className="space-y-3">
                 {subscriptions.filter(s => s.type === 'subscription').map(s => (
                   <div key={s.id} className="bg-white p-4 rounded-3xl border-2 border-stone-50 flex items-center justify-between shadow-sm hover:border-blue-100 transition-colors group">
                     <div className="flex items-center gap-4">
                       <div className="w-11 h-11 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shrink-0">
                         <Calendar size={18} />
                       </div>
                       <div>
                         <p className="font-black text-brand-primary text-sm leading-tight">{s.name}</p>
                         <div className="flex items-center gap-2 mt-0.5">
                           <span className="text-[9px] font-black text-stone-300 uppercase bg-stone-50 px-1.5 py-0.5 rounded tracking-tighter">Dzień: {s.paymentDay}</span>
                         </div>
                       </div>
                     </div>
                     <div className="flex items-center gap-3">
                       <p className="font-black text-brand-primary text-sm sm:text-base">{s.amount} zł</p>
                       <div className="flex items-center gap-2">
                         <button 
                           onClick={() => setNewSub({ name: s.name, amount: s.amount, paymentDay: s.paymentDay, type: s.type })}
                           className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-stone-50 text-stone-300 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center"
                           title="Edytuj (kopiuj do formularza)"
                         >
                           <Edit2 size={16} />
                         </button>
                         <button 
                           onClick={() => setSubscriptions(prev => prev.filter(x => x.id !== s.id))}
                           className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-stone-50 text-stone-300 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center"
                         >
                           <Trash2 size={16} />
                         </button>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>

             {/* Installments */}
             <div className="space-y-4">
               <div className="px-2 flex items-center justify-between">
                 <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Raty i Opłaty</h4>
                 <Plus size={14} className="text-stone-300" />
               </div>
               <div className="space-y-3">
                 {subscriptions.filter(s => s.type === 'installment').map(s => (
                   <div key={s.id} className="bg-white p-4 rounded-3xl border-2 border-stone-50 flex items-center justify-between shadow-sm hover:border-orange-100 transition-colors group">
                     <div className="flex items-center gap-4">
                       <div className="w-11 h-11 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 shrink-0">
                         <Banknote size={18} />
                       </div>
                       <div>
                         <p className="font-black text-brand-primary text-sm leading-tight">{s.name}</p>
                         <div className="flex items-center gap-2 mt-0.5">
                           <span className="text-[9px] font-black text-stone-300 uppercase bg-stone-50 px-1.5 py-0.5 rounded tracking-tighter">Dzień: {s.paymentDay}</span>
                         </div>
                       </div>
                     </div>
                     <div className="flex items-center gap-3">
                       <p className="font-black text-brand-primary text-sm sm:text-base">{s.amount} zł</p>
                       <div className="flex items-center gap-2">
                         <button 
                           onClick={() => setNewSub({ name: s.name, amount: s.amount, paymentDay: s.paymentDay, type: s.type })}
                           className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-stone-50 text-stone-300 hover:text-orange-500 hover:bg-orange-50 transition-all flex items-center justify-center"
                           title="Edytuj (kopiuj do formularza)"
                         >
                           <Edit2 size={16} />
                         </button>
                         <button 
                           onClick={() => setSubscriptions(prev => prev.filter(x => x.id !== s.id))}
                           className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-stone-50 text-stone-300 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center"
                         >
                           <Trash2 size={16} />
                         </button>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           </div>

           <form onSubmit={handleAddSub} className="bg-white p-6 sm:p-8 rounded-[2.5rem] border-2 border-blue-50 shadow-lg shadow-blue-900/5 grid grid-cols-1 sm:grid-cols-12 gap-4">
             <div className="sm:col-span-3">
               <label className="text-[10px] font-black uppercase text-stone-300 px-2 tracking-widest block mb-1">Typ</label>
               <select value={newSub.type} onChange={e => setNewSub({...newSub, type: e.target.value as 'subscription' | 'installment'})} className="w-full h-14 px-5 rounded-2xl font-black bg-stone-50 outline-none border-2 border-transparent focus:border-blue-200 text-sm">
                 <option value="subscription">💳 Subskrypcja</option>
                 <option value="installment">📅 Rata / Opłata</option>
               </select>
             </div>
             <div className="sm:col-span-4">
               <label className="text-[10px] font-black uppercase text-stone-300 px-2 tracking-widest block mb-1">Nazwa</label>
               <input type="text" placeholder="Np. Netflix / Telefon" value={newSub.name} onChange={e => setNewSub({...newSub, name: e.target.value})} className="w-full h-14 px-5 rounded-2xl font-black bg-stone-50 outline-none border-2 border-transparent focus:border-blue-200 text-sm" />
             </div>
             <div className="sm:col-span-2">
               <label className="text-[10px] font-black uppercase text-stone-300 px-2 tracking-widest block mb-1">Kwota</label>
               <input type="number" placeholder="0" value={newSub.amount || ''} onChange={e => setNewSub({...newSub, amount: parseFloat(e.target.value) || 0})} className="w-full h-14 px-5 rounded-2xl font-black bg-stone-50 outline-none border-2 border-transparent focus:border-blue-200 text-sm" />
             </div>
             <div className="sm:col-span-1">
               <label className="text-[10px] font-black uppercase text-stone-300 px-2 tracking-widest block mb-1">Dzień</label>
               <input type="number" min="1" max="31" placeholder="15" value={newSub.paymentDay} onChange={e => setNewSub({...newSub, paymentDay: parseInt(e.target.value) || 1})} className="w-full h-14 px-4 rounded-2xl font-black bg-stone-50 outline-none border-2 border-transparent focus:border-blue-200 text-center text-sm" />
             </div>
             <div className="sm:col-span-2 flex items-end">
               <button type="submit" className="w-full h-14 bg-blue-600 text-white font-black rounded-2xl uppercase text-[11px] tracking-[0.2em] shadow-lg shadow-blue-600/20 active:scale-95 transition-all">Dodaj</button>
             </div>
           </form>
        </section>

      </main>

      {/* History Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
                    <History size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-brand-primary">Archiwum</h2>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Historia Twojego skarbca</p>
                  </div>
                </div>
                <button onClick={() => setShowHistoryModal(false)} className="w-12 h-12 rounded-2xl bg-white border-2 border-stone-100 text-stone-400 hover:text-red-500 transition-all flex items-center justify-center">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-4">
                {history.map((h, i) => (
                  <div key={i} className="bg-stone-50 rounded-[2rem] p-6 border border-stone-100">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-xl font-black text-brand-primary">{h.month}</p>
                      <div className={cn("px-4 py-1 rounded-full font-black text-xs uppercase", h.savings >= 0 ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600")}>
                        {h.savings >= 0 ? 'Zysk' : 'Strata'}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-white p-3 rounded-2xl border border-stone-100">
                        <p className="text-[8px] font-black text-stone-300 uppercase mb-1">Kicek 🐰</p>
                        <p className="text-sm font-black text-emerald-600">+{h.kicekTutoring} zł</p>
                      </div>
                      <div className="bg-white p-3 rounded-2xl border border-stone-100">
                        <p className="text-[8px] font-black text-stone-300 uppercase mb-1">Szop 🦝</p>
                        <p className="text-sm font-black text-emerald-600">+{h.szopTutoring} zł</p>
                      </div>
                      <div className="bg-white p-3 rounded-2xl border border-stone-100">
                        <p className="text-[8px] font-black text-stone-300 uppercase mb-1">Wydatki</p>
                        <p className="text-sm font-black text-red-500">-{h.expenses} zł</p>
                      </div>
                      <div className="bg-white p-3 rounded-2xl border border-stone-100">
                        <p className="text-[8px] font-black text-stone-300 uppercase mb-1">Saldo</p>
                        <p className={cn("text-sm font-black", h.savings >= 0 ? "text-brand-primary" : "text-red-500")}>
                          {h.savings} zł
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {history.length === 0 && (
                  <div className="text-center py-20 opacity-20">
                    <History size={48} className="mx-auto mb-4" />
                    <p className="font-black uppercase tracking-widest text-xs">Brak zapisanej historii</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
