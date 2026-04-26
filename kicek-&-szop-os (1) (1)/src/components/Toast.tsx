import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, BellRing } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  icon?: string;
  type?: 'success' | 'info';
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, icon?: string, type?: 'success' | 'info') => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, icon?: string, type: 'success' | 'info' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, icon, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToasts() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToasts must be used within ToastProvider');
  return context;
}

export function ToastContainer({ toasts, removeToast }: { toasts: Toast[], removeToast: (id: string) => void }) {
  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 pointer-events-none w-full max-w-sm px-6">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className="pointer-events-auto bg-white/95 backdrop-blur-xl border border-stone-100 rounded-2xl shadow-2xl p-4 flex items-center gap-4 shadow-orange-900/10"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-2xl">
              {toast.icon || '✨'}
            </div>
            <div className="flex-1">
              <p className="font-bold text-brand-primary">{toast.message}</p>
            </div>
            <button 
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-stone-100 rounded-lg transition-colors text-stone-300"
            >
              <X size={18} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
