import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Battery, User, MapPin, 
  Plus, Trash2, X, Filter, Home, 
  Target, Gamepad2, Utensils, Wallet, 
  Package, ChevronRight, AlertCircle,
  Tag, Box, Zap, Pencil, Edit2, Heart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useToasts, ToastContainer } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';

type Owner = 'Kicek' | 'Szop' | 'Wspólne';
type Category = 'Elektronika' | 'Narzędzia' | 'Dokumenty' | 'Hobby' | 'Inne';

interface InventoryItem {
  id: string;
  name: string;
  owner: Owner;
  place: string;
  category: Category;
  inUse: boolean;
  battery?: number; // 0-100
  lastUpdated: string;
}

const ownerConfigs: Record<Owner, { emoji: string, color: string, bg: string }> = {
  'Kicek': { emoji: '🐰', color: 'text-blue-600', bg: 'bg-blue-50' },
  'Szop': { emoji: '🦝', color: 'text-orange-600', bg: 'bg-orange-50' },
  'Wspólne': { emoji: '🫂', color: 'text-amber-600', bg: 'bg-amber-50' },
};

const categoryIcons: Record<Category, any> = {
  'Elektronika': Zap,
  'Narzędzia': Package,
  'Dokumenty': Target,
  'Hobby': Gamepad2,
  'Inne': Box,
};

export default function Inventory() {
  const navigate = useNavigate();
  const { toasts, showToast, removeToast } = useToasts();

  // 1. Initial State from LocalStorage or Defaults
  const [items, setItems] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('inventoryData');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse inventoryData', e);
      }
    }
    // Default data if empty
    return [
      { id: '1', name: 'Aparat SONY A7', owner: 'Wspólne', place: 'Szafka w salonie', category: 'Elektronika', inUse: false, battery: 85, lastUpdated: new Date().toISOString() },
      { id: '2', name: 'Zestaw śrubokrętów', owner: 'Szop', place: 'Piwnica', category: 'Narzędzia', inUse: false, lastUpdated: new Date().toISOString() },
      { id: '3', name: 'Paszport Kicka', owner: 'Kicek', place: 'Szuflada Biuro', category: 'Dokumenty', inUse: false, lastUpdated: new Date().toISOString() },
    ];
  });

  // 2. Auto-save on every change
  useEffect(() => {
    localStorage.setItem('inventoryData', JSON.stringify(items));
  }, [items]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterOwner, setFilterOwner] = useState<Owner | 'Wszystkie'>('Wszystkie');
  const [filterLowBattery, setFilterLowBattery] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: '',
    owner: 'Wspólne',
    place: '',
    category: 'Inne',
    inUse: false,
    battery: undefined
  });

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.place.toLowerCase().includes(searchQuery.toLowerCase());
      const matchOwner = filterOwner === 'Wszystkie' || item.owner === filterOwner;
      const matchBattery = !filterLowBattery || (item.battery !== undefined && item.battery < 20);
      return matchSearch && matchOwner && matchBattery;
    });
  }, [items, searchQuery, filterOwner, filterLowBattery]);

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.place) return;

    if (editingItemId) {
      // Edit Existing
      setItems(prev => prev.map(item => 
        item.id === editingItemId 
          ? { 
              ...item, 
              name: newItem.name!, 
              owner: newItem.owner as Owner, 
              place: newItem.place!, 
              category: newItem.category as Category,
              battery: newItem.battery,
              lastUpdated: new Date().toISOString()
            } 
          : item
      ));
      showToast(`Zaktualizowano "${newItem.name}"! 🏠`, '✅');
    } else {
      // Add New
      const item: InventoryItem = {
        id: Date.now().toString(),
        name: newItem.name!,
        owner: newItem.owner as Owner,
        place: newItem.place!,
        category: newItem.category as Category,
        inUse: newItem.inUse || false,
        battery: newItem.battery,
        lastUpdated: new Date().toISOString()
      };
      setItems(prev => [item, ...prev]);
      showToast(`Dodano "${item.name}" do rejestru! 🏠`, '✨');
    }

    // Reset and Close
    setShowAddModal(false);
    setEditingItemId(null);
    setNewItem({ name: '', owner: 'Wspólne', place: '', category: 'Inne', inUse: false, battery: undefined });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten przedmiot z rejestru? 🗑️')) {
      const itemToDelete = items.find(i => i.id === id);
      setItems(prev => prev.filter(i => i.id !== id));
      showToast(`Usunięto: ${itemToDelete?.name || 'Przedmiot'}`, '🗑️');
    }
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItemId(item.id);
    setNewItem({
      name: item.name,
      owner: item.owner,
      place: item.place,
      category: item.category,
      inUse: item.inUse,
      battery: item.battery
    });
    setShowAddModal(true);
  };

  const openAddModal = () => {
    setEditingItemId(null);
    setNewItem({ name: '', owner: 'Wspólne', place: '', category: 'Inne', inUse: false, battery: undefined });
    setShowAddModal(true);
  };

  const toggleInUse = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, inUse: !item.inUse, lastUpdated: new Date().toISOString() } : item
    ));
  };

  const updateBatteryInline = (id: string, delta: number) => {
    setItems(prev => prev.map(item => 
      item.id === id && item.battery !== undefined 
        ? { ...item, battery: Math.max(0, Math.min(100, item.battery + delta)), lastUpdated: new Date().toISOString() } 
        : item
    ));
  };

  const getBatteryColor = (level: number) => {
    if (level < 20) return 'text-red-500';
    if (level < 50) return 'text-orange-500';
    return 'text-emerald-500';
  };

  return (
    <div className="min-h-screen bg-[#FDF8F3] pb-40">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <header className="p-6 sm:p-8 flex justify-between items-center max-w-5xl mx-auto w-full">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-5 h-5 text-orange-600" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300">
              Dom dla rzeczy
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-primary">
            Nasze <span className="text-orange-600 italic">Przedmioty</span>
          </h1>
        </div>
        <button 
          onClick={openAddModal}
          className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all text-orange-600 border border-orange-50"
        >
          <Plus size={24} />
        </button>
      </header>

      <main className="p-4 sm:p-8 space-y-8 sm:space-y-12 max-w-5xl mx-auto">
        
        {/* Search & Filters */}
        <div className="glass-card p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] flex flex-col md:flex-row gap-4 items-center w-full">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
            <input 
              type="text"
              placeholder="Gdzie to jest? Szukaj..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-stone-50 border-2 border-stone-100 rounded-2xl outline-none focus:border-orange-200 font-bold text-brand-primary text-base"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select 
              value={filterOwner}
              onChange={e => setFilterOwner(e.target.value as any)}
              className="flex-1 md:w-48 px-4 py-3 bg-white border-2 border-stone-50 rounded-2xl font-bold text-xs text-stone-600 appearance-none outline-none"
            >
              <option value="Wszystkie">Wszyscy</option>
              <option value="Kicek">🐰 Kicek</option>
              <option value="Szop">🦝 Szop</option>
              <option value="Wspólne">🫂 Wspólne</option>
            </select>
            <button 
              onClick={() => setFilterLowBattery(!filterLowBattery)}
              className={cn(
                "p-3 rounded-2xl border-2 transition-all flex items-center gap-2 shrink-0",
                filterLowBattery ? "bg-red-50 border-red-200 text-red-600" : "bg-white border-stone-50 text-stone-300"
              )}
            >
              <Battery size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Bateria</span>
            </button>
          </div>
        </div>

        {/* Inventory Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredItems.map(item => {
              const OwnerConfig = ownerConfigs[item.owner];
              const CatIcon = categoryIcons[item.category] || Box;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white p-6 sm:p-7 rounded-[2.5rem] border-2 border-stone-50 shadow-sm hover:shadow-xl hover:border-orange-100 transition-all group flex flex-col w-full"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", OwnerConfig.bg, OwnerConfig.color)}>
                      <CatIcon size={24} />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest", OwnerConfig.bg, OwnerConfig.color)}>
                        {OwnerConfig.emoji} {item.owner}
                      </span>
                      {item.battery !== undefined && (
                        <div className={cn("flex flex-col items-end gap-1 mt-2")}>
                          <div className={cn("flex items-center gap-1 font-black text-xs", getBatteryColor(item.battery))}>
                            <Battery size={14} fill="currentColor" fillOpacity={0.2} />
                            {item.battery}%
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => updateBatteryInline(item.id, -5)}
                              className="w-6 h-6 rounded-md bg-stone-50 text-stone-400 hover:text-orange-500 flex items-center justify-center text-xs font-black transition-colors"
                            >
                              -
                            </button>
                            <button 
                              onClick={() => updateBatteryInline(item.id, 5)}
                              className="w-6 h-6 rounded-md bg-stone-50 text-stone-400 hover:text-orange-500 flex items-center justify-center text-xs font-black transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                    <h3 className="text-lg font-black text-brand-primary line-clamp-1">{item.name}</h3>
                    <div className="flex items-center gap-2 text-stone-400">
                      <MapPin size={14} className="text-orange-400" />
                      <span className="text-xs font-bold">{item.place}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-stone-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleInUse(item.id)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-xl transition-all",
                          item.inUse ? "bg-emerald-50 text-emerald-600" : "bg-stone-50 text-stone-400"
                        )}
                      >
                        <div className={cn("w-2 h-2 rounded-full", item.inUse ? "bg-emerald-500 animate-pulse" : "bg-stone-300")} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{item.inUse ? 'Używane' : 'Dostępne'}</span>
                      </button>
                      <button 
                        onClick={() => openEditModal(item)}
                        className="w-9 h-9 rounded-lg bg-stone-50 text-stone-300 hover:bg-orange-50 hover:text-orange-600 transition-all flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="w-9 h-9 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-all flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {filteredItems.length === 0 && (
            <div className="col-span-full py-20 text-center space-y-4 opacity-50">
              <div className="w-20 h-20 bg-white rounded-[2.5rem] flex items-center justify-center text-3xl mx-auto shadow-sm">🔍</div>
              <p className="text-stone-400 font-bold italic">Niczego nie znaleźliśmy...</p>
            </div>
          )}
        </div>
      </main>

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowAddModal(false); setEditingItemId(null); }}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
              className="relative w-full max-w-xl bg-white rounded-t-[3rem] sm:rounded-[3.5rem] shadow-2xl p-6 sm:p-10 max-h-[95vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl sm:text-2xl font-black text-brand-primary flex items-center gap-3">
                  <Package className="text-orange-500" /> {editingItemId ? 'Edytuj Przedmiot' : 'Nowy Przedmiot'}
                </h3>
                <button onClick={() => { setShowAddModal(false); setEditingItemId(null); }} className="text-stone-300 hover:text-stone-500 transition-colors h-12 w-12 flex items-center justify-center">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSaveItem} className="space-y-6">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 px-1">Nazwa</span>
                  <input type="text" placeholder="Np. Aparat Sony, Wiertarka..." value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full px-6 py-4 bg-stone-50 border-2 border-stone-100 rounded-2xl outline-none focus:border-orange-200 font-bold text-brand-primary text-base" required />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 px-1">Miejsce</span>
                    <input type="text" placeholder="Szafka, piwnica..." value={newItem.place} onChange={e => setNewItem({...newItem, place: e.target.value})} className="w-full px-6 py-4 bg-stone-50 border-2 border-stone-100 rounded-2xl outline-none focus:border-orange-200 font-bold text-brand-primary text-base" required />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 px-1">Właściciel</span>
                    <select value={newItem.owner} onChange={e => setNewItem({...newItem, owner: e.target.value as any})} className="w-full px-6 py-4 bg-stone-50 border-2 border-stone-100 rounded-2xl outline-none focus:border-orange-200 font-bold text-brand-primary text-base">
                      <option value="Wspólne">🫂 Wspólne</option>
                      <option value="Kicek">🐰 Kicek</option>
                      <option value="Szop">🦝 Szop</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 px-1">Kategoria</span>
                    <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value as any})} className="w-full px-6 py-4 bg-stone-50 border-2 border-stone-100 rounded-2xl outline-none focus:border-orange-200 font-bold text-brand-primary text-base">
                      <option value="Inne">Domyślna (Inne)</option>
                      <option value="Elektronika">⚡ Elektronika</option>
                      <option value="Narzędzia">🔨 Narzędzia</option>
                      <option value="Dokumenty">📄 Dokumenty</option>
                      <option value="Hobby">🎮 Hobby</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 px-1">Bateria 🔋</span>
                    <div className="flex items-center gap-4 py-2">
                      <input type="range" min="0" max="100" value={newItem.battery || 100} onChange={e => setNewItem({...newItem, battery: parseInt(e.target.value)})} disabled={newItem.category !== 'Elektronika'} className="flex-1 accent-orange-500 disabled:opacity-30 h-6" />
                      <span className="text-sm font-black text-brand-primary w-12 text-right">{newItem.battery !== undefined ? `${newItem.battery}%` : '—'}</span>
                    </div>
                  </div>
                </div>

                <button type="submit" className="w-full py-5 bg-brand-primary text-white font-black rounded-[2rem] shadow-xl hover:scale-[1.01] active:scale-95 transition-all text-xs uppercase tracking-[0.2em] mt-4">
                  {editingItemId ? 'Zapisz Zmiany' : 'Dodaj Przedmiot'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
