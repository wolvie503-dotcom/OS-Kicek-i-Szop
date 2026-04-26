import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogOut, ChevronUp, ChevronDown, Heart, Zap, 
  Target, Sparkles, CheckCircle2, Trash2, Plus, X, User, Droplets, Coins
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useToasts, ToastContainer } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { useStats } from '../contexts/StatsContext';

// FIREBASE IMPORTS
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

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

  const userMetadata = user?.user_metadata || {};
  const currentCharacter = (userMetadata.character === '🦝' ? 'Szop' : 'Kicek') as 'Kicek' | 'Szop';
  const charEmoji = currentCharacter === 'Kicek' ? '🐰' : '🦝';

  // --- FIREBASE STATE ---
  const [kicek, setKicek] = useState<UserState>({ character: 'Kicek', emoji: '🐰', battery: 80, status: 'Aktywny', isOnline: true });
  const [szop, setSzop] = useState<UserState>({ character: 'Szop', emoji: '🦝', battery: 80, status: 'Skupienie', isOnline: true });
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [kicekWater, setKicekWater] = useState({ current: 0, goal: 8 });
  const [szopWater, setSzopWater] = useState({ current: 0, goal: 8 });
  const [quickSignals, setQuickSignals] = useState<any[]>([]);

  // 1. SYNC DATA FROM FIREBASE (onSnapshot)
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "global", "dashboard"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.kicek) setKicek(data.kicek);
        if (data.szop) setSzop(data.szop);
        if (data.schedule) setSchedule(data.schedule);
        if (data.kicekWater) setKicekWater(data.kicekWater);
        if (data.szopWater) setSzopWater(data.szopWater);
        if (data.quickSignals) setQuickSignals(data.quickSignals);
      } else {
        // Init empty state in Firebase if doc doesn't exist
        setDoc(doc(db, "global", "dashboard"), { kicek, szop, schedule, kicekWater, szopWater, quickSignals });
      }
    });
    return () => unsub();
  }, []);

  // 2. HELPER TO UPDATE FIREBASE
  const updateFirebase = async (updates: any) => {
    const dashRef = doc(db, "global", "dashboard");
    await updateDoc(dashRef, updates);
  };

  const updateBattery = (val: number) => {
    const isKicek = currentCharacter === 'Kicek';
    const currentVal = isKicek ? kicek.battery : szop.battery;
    const newVal = Math.min(100, Math.max(0, currentVal + val));
    
    updateFirebase({
      [isKicek ? 'kicek.battery' : 'szop.battery']: newVal
    });
  };

  const updateStatus = (status: Status) => {
    updateFirebase({
      [currentCharacter === 'Kicek' ? 'kicek.status' : 'szop.status']: status
    });
    showToast(`Status: ${status}`, statusConfig[status].emoji);
  };

  const addWater = (char: 'Kicek' | 'Szop') => {
    const isKicek = char === 'Kicek';
    const waterState = isKicek ? kicekWater : szopWater;
    if (waterState.current >= waterState.goal) return;

    const newCurrent = waterState.current + 1;
    updateFirebase({
      [isKicek ? 'kicekWater.current' : 'szopWater.current']: newCurrent
    });

    if (newCurrent === waterState.goal) {
      addRewards(isKicek ? 'Kicek 🐰' : 'Szop 🦝' as any, 20, 50);
      showToast(`Brawo ${char}! Nawodnienie zaliczone! +20💰`, '💧');
    }
  };

  const toggleSchedule = (id: string) => {
    const newSchedule = schedule.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    updateFirebase({ schedule: newSchedule });
  };

  const deleteScheduleItem = (id: string) => {
    updateFirebase({ schedule: schedule.filter(i => i.id !== id) });
  };

  // Reszta logiki dodawania (uproszczona dla Firebase)
  const addScheduleItem = (e: React.FormEvent) => {
    e.preventDefault();
    // Pobierz wartości z lokalnego state formularza (musisz dodać useState dla pól input tak jak miałeś)
    // Przykład: updateFirebase({ schedule: [...schedule, newItem] });
  };

  const handleLogout = async () => { await signOut(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-[#FDF8F3] pb-40">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {/* HEADER I RESZTA UI ZOSTAJE TAKA SAMA JAK W TWOIM PLIKU */}
      {/* ... (Tu wstaw całą sekcję return z Twojego kodu) ... */}
    </div>
  );
}
