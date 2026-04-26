import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, CheckCircle2, Plus, Minus, Trash2, X, Edit2, Check, TrendingDown, CreditCard, Calendar, History, Sparkles, Banknote 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useToasts, ToastContainer } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';

// FIREBASE
import { db } from '../lib/firebase';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';

type Person = 'Kicek 🐰' | 'Szop 🦝';
type ExpenseCategory = 'Jedzenie' | 'Rozrywka' | 'Inne';

interface TutoringSession {
  id: string;
  person: Person;
  studentName: string;
  hours: number;
  rate: number;
  isPaid: boolean;
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

export default function Budget() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { toasts, showToast, removeToast } = useToasts();

  // --- STATE ---
  const [sessions, setSessions] = useState<TutoringSession[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [monthlyLimit, setMonthlyLimit] = useState<number>(3000);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);

  // Form states - kluczowe dla uniknięcia błędów Builda
  const [newSession, setNewSession] = useState<{ person: Person; student: string; rate: number }>({ person: 'Kicek 🐰', student: '', rate: 80 });
  const [newExpense, setNewExpense] = useState<{ name: string; amount: number; category: ExpenseCategory }>({ name: '', amount: 0, category: 'Jedzenie' });

  // 1. SYNC Z FIREBASE
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "global", "budget"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSessions(data.sessions || []);
        setExpenses(data.expenses || []);
        setSubscriptions(data.subscriptions || []);
        setMonthlyLimit(data.monthlyLimit || 3000);
        setCurrentMonth(data.currentMonth || new Date().toISOString().slice(0, 7));
      } else {
        setDoc(doc(db, "global", "budget"), {
          sessions: [], expenses: [], subscriptions: [], monthlyLimit: 3000, currentMonth: new Date().toISOString().slice(0, 7)
        });
      }
    });
    return () => unsub();
  }, []);

  const updateFirebase = async (updates: any) => {
    await updateDoc(doc(db, "global", "budget"), updates);
  };

  // --- CALCULATIONS ---
  const totalTutoringEarned = useMemo(() => 
    sessions.filter(s => s.isPaid).reduce((acc, s) => acc + s.hours * s.rate, 0), [sessions]
  );
  
  const totalSubscriptions = useMemo(() => 
    subscriptions.reduce((acc, s) => acc + s.amount, 0), [subscriptions]
  );

  const totalOut = useMemo(() => 
    expenses.reduce((acc, e) => acc + e.amount, 0) + totalSubscriptions, [expenses, totalSubscriptions]
  );

  // --- ACTIONS ---
  const updateStudentHours = (id: string, delta: number) => {
    const newSessions = sessions.map(s => s.id === id ? { ...s, hours: Math.max(0, s.hours + delta) } : s);
    updateFirebase({ sessions: newSessions });
  };

  const togglePaid = (id: string) => {
    const newSessions = sessions.map(s => s.id === id ? { ...s, isPaid: !s.isPaid } : s);
    updateFirebase({ sessions: newSessions });
  };

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSession.student) return;
    const session: TutoringSession = { 
      id: Date.now().toString(), 
      person: newSession.person, 
      studentName: newSession.student, 
      hours: 0, 
      rate: newSession.rate, 
      isPaid: false 
    };
    updateFirebase({ sessions: [session, ...sessions] });
    setNewSession({ ...newSession, student: '' });
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
    updateFirebase({ expenses: [expense, ...expenses] });
    setNewExpense({ name: '', amount: 0, category: 'Jedzenie' });
    showToast(`Wydatek dodany!`, '💸');
  };

  const deleteExpense = (id: string) => {
    updateFirebase({ expenses: expenses.filter(e => e.id !== id) });
  };

  const progress = Math.min(100, (totalOut / monthlyLimit) * 100);

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
      </header>

      <main className="p-3 sm:p-8 space-y-6 sm:space-y-12 max-w-6xl mx-auto">
        <section className="bg-white rounded-[2.5rem] p-6 sm:p-10 border-2 border-stone-100 shadow-xl shadow-amber-900/5">
           <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-stone-300 uppercase text-xs font-black tracking-widest">Limit Miesięczny</h2>
                <p className="text-2xl font-black text-brand-primary">{monthlyLimit} zł</p>
              </div>
              <div className="text-right">
                <p className="text-stone-300 uppercase text-xs font-black tracking-widest">Wydano</p>
                <p className="text-2xl font-black text-red-500">{totalOut.toFixed(0)} zł</p>
              </div>
           </div>
           <div className="h-4 bg-stone-100 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className={cn("h-full", progress > 90 ? "bg-red-500" : "bg-amber-500")} />
           </div>
        </section>

        <div className="grid grid-cols-2 gap-4">
           <div className="bg-emerald-50 p-6 rounded-3xl border-2 border-emerald-100 text-center">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Wpływy</p>
              <p className="text-xl font-black text-emerald-600">+{totalTutoringEarned} zł</p>
           </div>
           <div className="bg-red-50 p-6 rounded-3xl border-2 border-red-100 text-center">
              <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Wypływy</p>
              <p className="text-xl font-black text-red-600">-{totalOut.toFixed(0)} zł</p>
           </div>
        </div>

        <section className="space-y-4">
          <h3 className="text-lg font-black text-brand-primary uppercase px-2">Korepetycje</h3>
          <form onSubmit={handleAddSession} className="bg-white p-6 rounded-[2rem] border-2 border-stone-50 grid grid-cols-1 sm:grid-cols-4 gap-4">
             <select value={newSession.person} onChange={e => setNewSession({...newSession, person: e.target.value as Person})} className="h-12 px-4 rounded-xl bg-stone-50 font-bold outline-none">
                <option value="Kicek 🐰">🐰 Kicek</option>
                <option value="Szop 🦝">🦝 Szop</option>
             </select>
             <input type="text" placeholder="Uczeń" value={newSession.student} onChange={e => setNewSession({...newSession, student: e.target.value})} className="h-12 px-4 rounded-xl bg-stone-50 font-bold outline-none" />
             <input type="number" placeholder="Stawka" value={newSession.rate} onChange={e => setNewSession({...newSession, rate: parseInt(e.target.value)})} className="h-12 px-4 rounded-xl bg-stone-50 font-bold outline-none" />
             <button type="submit" className="h-12 bg-orange-600 text-white font-black rounded-xl uppercase text-xs">Dodaj</button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map(s => (
              <div key={s.id} className="bg-white p-4 rounded-2xl border-2 border-stone-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => togglePaid(s.id)} className={cn("w-5 h-5 rounded-full border-2", s.isPaid ? "bg-emerald-500 border-emerald-500" : "border-stone-200")} />
                  <span className="font-bold text-brand-primary text-sm">{s.studentName}</span>
                </div>
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-2">
                      <button onClick={() => updateStudentHours(s.id, -1)} className="text-stone-300"><Minus size={14}/></button>
                      <span className="font-black text-xs">{s.hours}h</span>
                      <button onClick={() => updateStudentHours(s.id, 1)} className="text-stone-300"><Plus size={14}/></button>
                   </div>
                   <p className="font-black text-brand-primary text-sm">{s.hours * s.rate} zł</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-black text-brand-primary uppercase px-2">Wydatki</h3>
          <form onSubmit={handleAddExpense} className="bg-white p-6 rounded-[2rem] border-2 border-stone-50 grid grid-cols-1 sm:grid-cols-3 gap-4">
             <input type="text" placeholder="Co?" value={newExpense.name} onChange={e => setNewExpense({...newExpense, name: e.target.value})} className="h-12 px-4 rounded-xl bg-stone-50 font-bold outline-none" />
             <input type="number" placeholder="Kwota" value={newExpense.amount || ''} onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})} className="h-12 px-4 rounded-xl bg-stone-50 font-bold outline-none" />
             <button type="submit" className="h-12 bg-stone-800 text-white font-black rounded-xl uppercase text-xs">Dodaj</button>
          </form>

          <div className="bg-white rounded-3xl border-2 border-stone-50 overflow-hidden">
            {expenses.map(e => (
              <div key={e.id} className="flex justify-between items-center p-4 border-b last:border-0 hover:bg-stone-50">
                <div>
                  <p className="font-bold text-brand-primary text-sm">{e.name}</p>
                  <p className="text-[10px] text-stone-300 uppercase font-black">{new Date(e.date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-black text-red-500 text-sm">-{e.amount} zł</span>
                  <button onClick={() => deleteExpense(e.id)} className="text-stone-200 hover:text-red-500"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
