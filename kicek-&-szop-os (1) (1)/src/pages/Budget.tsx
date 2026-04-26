import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);

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

  // 2. FUNKCJA UPDATE
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

  // --- FORMS STATE ---
// Znajdź to miejsce i popraw na:
const [newSession, setNewSession] = useState<{ person: Person; student: string; rate: number }>({ 
  person: 'Kicek 🐰', 
  student: '', 
  rate: 80 
});

const [newExpense, setNewExpense] = useState<{ name: string; amount: number; category: ExpenseCategory }>({ 
  name: '', 
  amount: 0, 
  category: 'Jedzenie' 
});
