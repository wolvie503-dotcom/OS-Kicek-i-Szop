import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, Target, Gamepad2, Utensils, 
  Wallet, Package, Heart 
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/quests', icon: Target, label: 'Quests' },
    { path: '/activities', icon: Gamepad2, label: 'Fun' },
    { path: '/food', icon: Utensils, label: 'Jedzonko' },
    { path: '/budget', icon: Wallet, label: 'Kasa' },
    { path: '/inventory', icon: Package, label: 'Dom' },
    { path: '/gratitude', icon: Heart, label: 'Dzięki' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-8 pointer-events-none">
      <div className="max-w-xl mx-auto w-full pointer-events-auto">
        <nav className="bg-white/80 backdrop-blur-2xl border border-white/50 p-2 sm:p-3 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center justify-between ring-1 ring-stone-100/50">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "relative flex flex-col items-center justify-center transition-all duration-300 group",
                  isActive 
                    ? "w-12 h-12 sm:w-16 sm:h-16 bg-orange-600 text-white rounded-[1.5rem] sm:rounded-[1.8rem] shadow-lg shadow-orange-600/20" 
                    : "w-10 h-10 sm:w-14 sm:h-14 text-stone-300 hover:text-orange-400 hover:bg-stone-50 rounded-[1.2rem] sm:rounded-[1.5rem]"
                )}
              >
                <Icon size={isActive ? 22 : 20} className={cn(isActive && "sm:w-6 sm:h-6")} />
                {isActive && (
                  <motion.div 
                    layoutId="nav-glow"
                    className="absolute -inset-1 bg-orange-500/20 blur-xl rounded-full -z-10"
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

import { motion } from 'motion/react';
