import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToasts } from '../components/Toast';

interface UserStats {
  gold: number;
  xp: number;
  level: number;
}

interface StatsContextType {
  kicekStats: UserStats;
  szopStats: UserStats;
  addRewards: (nickname: 'Kicek 🐰' | 'Szop 🦝' | 'Razem 🫂', gold: number, xp: number) => void;
  spendGold: (nickname: 'Kicek 🐰' | 'Szop 🦝', amount: number) => boolean;
}

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export const StatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToasts();
  
  const [kicekStats, setKicekStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('kicek_stats');
    return saved ? JSON.parse(saved) : { gold: 150, xp: 1250, level: 12 };
  });

  const [szopStats, setSzopStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('szop_stats');
    return saved ? JSON.parse(saved) : { gold: 120, xp: 950, level: 9 };
  });

  useEffect(() => {
    localStorage.setItem('kicek_stats', JSON.stringify(kicekStats));
  }, [kicekStats]);

  useEffect(() => {
    localStorage.setItem('szop_stats', JSON.stringify(szopStats));
  }, [szopStats]);

  const processStats = (prev: UserStats, gold: number, xp: number) => {
    let newStats = { ...prev, gold: prev.gold + gold, xp: prev.xp + xp };
    
    while (newStats.xp >= newStats.level * 100) {
      const xpNeeded = newStats.level * 100;
      newStats.xp -= xpNeeded;
      newStats.level += 1;
      newStats.gold += 100;
    }
    
    return newStats;
  };

  useEffect(() => {
    const prevLevel = Number(localStorage.getItem('kicek_level') || kicekStats.level);
    if (kicekStats.level > prevLevel) {
      showToast(`AWANS! Kicek 🐰 wskoczył na wyższy poziom (${kicekStats.level})! +${(kicekStats.level - prevLevel) * 100} 💰 bonusu! 🎊`, '✨');
      localStorage.setItem('kicek_level', kicekStats.level.toString());
    }
  }, [kicekStats.level]);

  useEffect(() => {
    const prevLevel = Number(localStorage.getItem('szop_level') || szopStats.level);
    if (szopStats.level > prevLevel) {
      showToast(`AWANS! Szop 🦝 wskoczył na wyższy poziom (${szopStats.level})! +${(szopStats.level - prevLevel) * 100} 💰 bonusu! 🎊`, '✨');
      localStorage.setItem('szop_level', szopStats.level.toString());
    }
  }, [szopStats.level]);

  const addRewards = (nickname: 'Kicek 🐰' | 'Szop 🦝' | 'Razem 🫂', gold: number, xp: number) => {
    if (nickname === 'Kicek 🐰' || nickname === 'Razem 🫂') {
      setKicekStats(prev => processStats(prev, gold, xp));
    }
    if (nickname === 'Szop 🦝' || nickname === 'Razem 🫂') {
      setSzopStats(prev => processStats(prev, gold, xp));
    }
  };

  const spendGold = (nickname: 'Kicek 🐰' | 'Szop 🦝', amount: number) => {
    let success = false;
    if (nickname === 'Kicek 🐰') {
      if (kicekStats.gold >= amount) {
        setKicekStats(prev => ({ ...prev, gold: prev.gold - amount }));
        success = true;
      }
    } else if (nickname === 'Szop 🦝') {
      if (szopStats.gold >= amount) {
        setSzopStats(prev => ({ ...prev, gold: prev.gold - amount }));
        success = true;
      }
    }
    return success;
  };

  return (
    <StatsContext.Provider value={{ kicekStats, szopStats, addRewards, spendGold }}>
      {children}
    </StatsContext.Provider>
  );
};

export const useStats = () => {
  const context = useContext(StatsContext);
  if (!context) throw new Error('useStats must be used within StatsProvider');
  return context;
};
