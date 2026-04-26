import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isMockMode, mockUser } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isMock: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  isMock: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Bezpiecznik czasowy - max 2 sekundy na ładowanie
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Auth timeout reached. Releasing loading state.');
        if (isMockMode && !user) {
          setUser(mockUser as any);
        }
        setLoading(false);
      }
    }, 2000);

    const initAuth = async () => {
      try {
        if (isMockMode) {
          setUser(mockUser as any);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
          setLoading(false);
        });

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        // Zawsze wyłączamy loading po próbie inicjalizacji
        setLoading(false);
        clearTimeout(timeout);
      }
    };

    initAuth();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, isMock: isMockMode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
