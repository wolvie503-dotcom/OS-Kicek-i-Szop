import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToasts } from '../components/Toast';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

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
  
  const [kicekStats, setKicekStats] = useState<UserStats>({ gold: 150, xp: 0, level: 1 });
  const [szopStats, setSzopStats] = useState<UserStats>({ gold: 120, xp: 0, level: 1 });

  // --- SYNCHRONIZACJA Z FIREBASE ---
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "global", "stats"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.kicek) setKicekStats(data.kicek);
        if (data.szop) setSzopStats(data.szop);
      } else {
        // Jeśli dokument nie istnieje, stwórz go z początkowymi danymi
        setDoc(doc(db, "global", "stats"), {
          kicek: kicekStats,
          szop: szopStats
        });
      }
    });
    return () => unsub();
  }, []);

  const updateFirebaseStats = async (newKicek: UserStats, newSzop: UserStats) => {
    await updateDoc(doc(db, "global", "stats"), {
      kicek: newKicek,
      szop: newSzop
    });
  };

  const processStats = (prev: UserStats, gold: number, xp: number) => {
    let newStats = { ...prev, gold: prev.gold + gold, xp: prev.xp + xp };
    let levelsGained = 0;
    
    while (newStats.xp >= newStats.level * 100) {
      const xpNeeded = newStats.level * 100;
      newStats.xp -= xpNeeded;
      newStats.level += 1;
      newStats.gold += 100;
      levelsGained++;
    }
    
    return { newStats, levelsGained };
  };

  const addRewards = async (nickname: 'Kicek 🐰' | 'Szop 🦝' | 'Razem 🫂', gold: number, xp: number) => {
    let nextKicek = { ...kicekStats };
    let nextSzop = { ...szopStats };

    if (nickname === 'Kicek 🐰' || nickname === 'Razem 🫂') {
      const result = processStats(kicekStats, gold, xp);
      nextKicek = result.newStats;
      if (result.levelsGained > 0) showToast(`AWANS! Kicek 🐰 jest na poziomie ${nextKicek.level}! ✨`, '🎊');
    }
    
    if (nickname === 'Szop 🦝' || nickname === 'Razem 🫂') {
      const result = processStats(szopStats, gold, xp);
      nextSzop = result.newStats;
      if (result.levelsGained > 0) showToast(`AWANS! Szop 🦝 jest na poziomie ${nextSzop.level}! ✨`, '🎊');
    }

    await updateFirebaseStats(nextKicek, nextSzop);
  };

  const spendGold = (nickname: 'Kicek 🐰' | 'Szop 🦝', amount: number) => {
    if (nickname === 'Kicek 🐰' && kicekStats.gold >= amount) {
      updateFirebaseStats({ ...kicekStats, gold: kicekStats.gold - amount }, szopStats);
      return true;
    } 
    if (nickname === 'Szop 🦝' && szopStats.gold >= amount) {
      updateFirebaseStats(kicekStats, { ...szopStats, gold: szopStats.gold - amount });
      return true;
    }
    return false;
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
