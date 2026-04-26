import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, Send, Trash2, X, Home, 
  Target, Gamepad2, Utensils, Wallet, 
  Package, Calendar, Star, Sparkles,
  MessageSquareHeart, Users, History
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useToasts, ToastContainer } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { useStats } from '../contexts/StatsContext';

interface GratitudeNote {
  id: string;
  from: 'Kicek' | 'Szop';
  to: 'Kicek' | 'Szop';
  content: string;
  color: string;
  timestamp: string;
  isRead: boolean;
}

const pastelColors = [
  'bg-yellow-50 border-yellow-200 text-yellow-800',
  'bg-pink-50 border-pink-200 text-pink-800',
  'bg-blue-50 border-blue-200 text-blue-800',
  'bg-emerald-50 border-emerald-200 text-emerald-800',
  'bg-purple-50 border-purple-200 text-purple-800',
  'bg-orange-50 border-orange-200 text-orange-800',
];

export default function Gratitude() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toasts, showToast, removeToast } = useToasts();
  const { addRewards } = useStats();

  const isKicek = user?.user_metadata?.name !== 'Szop';
  const myName = isKicek ? 'Kicek' : 'Szop';
  const partnerName = isKicek ? 'Szop' : 'Kicek';

  const getFromStorage = <T,>(key: string, defaultValue: T): T => {
    const saved = localStorage.getItem(key);
    if (!saved) return defaultValue;
    try { return JSON.parse(saved); } catch { return defaultValue; }
  };

  const saveToStorage = (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  const [notes, setNotes] = useState<GratitudeNote[]>(() => getFromStorage('app_gratitude_notes', [
    { id: '1', from: 'Szop', to: 'Kicek', content: 'Dzięki za kawę! ❤️', color: pastelColors[0], timestamp: new Date().toISOString(), isRead: true },
  ]));

  React.useEffect(() => saveToStorage('app_gratitude_notes', notes), [notes]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newContent, setNewContent] = useState('');

  const addNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent) return;

    const note: GratitudeNote = {
      id: Date.now().toString(),
      from: myName,
      to: partnerName,
      content: newContent,
      color: pastelColors[Math.floor(Math.random() * pastelColors.length)],
      timestamp: new Date().toISOString(),
      isRead: false
    };

    setNotes(prev => [note, ...prev]);
    setShowAddModal(false);
    setNewContent('');
    addRewards(myName === 'Kicek' ? 'Kicek 🐰' : 'Szop 🦝', 0, 5); 
    showToast(`Wysłano dla ${partnerName}! +5 XP ✨`, '❤️');
  };

  return (
    <div className="min-h-screen bg-[#FDF8F3] pb-40">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <header className="p-4 sm:p-8 flex justify-between items-center max-w-5xl mx-auto w-full">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300">WDZIĘCZNOŚĆ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-primary">Dobre <span className="text-rose-500 italic">Słowa</span></h1>
        </div>
        <button onClick={() => setShowAddModal(true)} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg text-rose-500 border border-rose-50 active:scale-90 transition-all"><Send size={24} /></button>
      </header>

      <main className="p-4 sm:p-8 space-y-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence initial={false}>
            {notes.map((note, index) => (
              <motion.div key={note.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1, rotate: index % 2 === 0 ? -1 : 1 }} exit={{ opacity: 0, scale: 0.9 }} className={cn("relative p-6 rounded-[2rem] border-2 shadow-lg min-h-[160px] flex flex-col justify-between", note.color)}>
                 <p className="italic font-bold text-lg leading-relaxed">"{note.content}"</p>
                 <div className="mt-4 flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Od: {note.from}</span>
                    <button onClick={() => setNotes(prev => prev.filter(x => x.id !== note.id))} className="text-stone-400/50"><Trash2 size={16} /></button>
                 </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" />
             <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] sm:rounded-[3.5rem] p-8 sm:p-10">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-xl font-black text-brand-primary">Napisz coś miłego ✨</h3>
                   <button onClick={() => setShowAddModal(false)}><X size={24} /></button>
                </div>
                <form onSubmit={addNote} className="space-y-6">
                   <textarea autoFocus placeholder="Dziękuję za..." value={newContent} onChange={e => setNewContent(e.target.value)} className="w-full h-40 p-6 bg-stone-50 border-2 border-stone-100 rounded-[2rem] outline-none focus:border-rose-300 font-bold italic text-lg" required />
                   <button type="submit" className="w-full py-5 bg-brand-primary text-white font-black rounded-[2rem] shadow-xl uppercase text-xs tracking-widest">Wyślij do {partnerName}</button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
