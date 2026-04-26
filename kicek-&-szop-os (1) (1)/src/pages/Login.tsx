import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sparkles, Heart } from 'lucide-react';
import { supabase, isMockMode } from '../lib/supabase';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (isMockMode) {
      setTimeout(() => {
        setIsLoading(false);
        navigate('/dashboard');
      }, 800);
      return;
    }

    if (!supabase) return;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Błąd logowania');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-[#FDF8F3]">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
        {/* Left Side: Info */}
        <div className="md:col-span-12 lg:col-span-5 flex flex-col justify-center space-y-8">
          <div className="inline-flex items-center space-x-3 bg-orange-100 w-fit px-4 py-2 rounded-full border border-orange-200 text-orange-800 font-bold text-xs uppercase tracking-widest">
            <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>
            <span>System v1.0.0 — Kicek & Szop OS</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-black leading-none tracking-tight text-brand-primary">
            Twój wspólny<br/>
            <span className="text-orange-600 italic">Life OS</span>
          </h1>
          
          <p className="text-xl text-stone-600 leading-relaxed max-w-md">
            Zorganizuj swój świat, buduj nawyki i dbaj o bliskość w jednym przytulnym miejscu.
          </p>

          <div className="flex items-center space-x-4 text-stone-500">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-2xl shadow-inner">
              ⚙️
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-widest opacity-40">Status Połączenia</span>
              <span className={isMockMode ? "text-orange-600 font-bold" : "text-green-700 font-bold"}>
                {isMockMode ? "Tryb Offline (Mock Mode)" : "Połączono z Cloud"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="md:col-span-12 lg:col-span-7 glass-card p-12 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-stone-100"></div>
            <div className="w-3 h-3 rounded-full bg-stone-100"></div>
            <div className="w-3 h-3 rounded-full bg-stone-100"></div>
          </div>

          <div className="mb-10">
            <h2 className="text-4xl font-black mb-3">Witajcie! 👋</h2>
            <p className="text-stone-500 font-medium">Zaloguj się, aby kontynuować wspólną przygodę.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-stone-400 ml-1">E-mail</label>
              <input 
                type="email" 
                required
                className="input-field"
                placeholder="twoj@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-stone-400 ml-1">Hasło</label>
              <input 
                type="password" 
                required
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-bold border border-red-100 text-center"
              >
                {error}
              </motion.p>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="btn-primary w-full text-xl py-5"
            >
              {isLoading ? (
                <Sparkles className="w-6 h-6 animate-spin text-white/50" />
              ) : (
                <>
                  <span>Zacznij przygodę</span>
                  <span className="text-2xl">✨</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-stone-400 font-medium">
              Nie masz jeszcze konta?{' '}
              <Link to="/register" className="text-orange-600 font-black hover:underline underline-offset-4">
                Zarejestruj się tutaj
              </Link>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-8">
            <div className="h-1.5 bg-stone-50 rounded-full"></div>
            <div className="h-1.5 bg-orange-600/40 rounded-full"></div>
            <div className="h-1.5 bg-stone-50 rounded-full"></div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
