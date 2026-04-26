import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sparkles, UserPlus } from 'lucide-react';
import { supabase, isMockMode } from '../lib/supabase';
import { cn } from '../lib/utils';

export default function Register() {
  const navigate = useNavigate();
  const [character, setCharacter] = useState<'Kicek' | 'Szop' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!character) {
      setError('Wybierz swoją postać! 🐰/🦝');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    if (isMockMode) {
      setTimeout(() => {
        setIsLoading(false);
        navigate('/dashboard'); // W trybie mock od razu do panelu dla wygody testów
      }, 800);
      return;
    }

    if (!supabase) {
      setError('Błąd konfiguracji: Brak połączenia z bazą. Spróbuj w trybie Mock.');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            character: character === 'Kicek' ? '🐰' : '🦝',
            name: character
          }
        }
      });
      if (error) throw error;
      // W normalnym trybie Supabase często wymaga potwierdzenia maila, więc lepiej wrócić do logowania
      navigate('/login'); 
    } catch (err: any) {
      setError(err.message || 'Błąd rejestracji');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-[#FDF8F3]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl glass-card p-12 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-stone-100"></div>
          <div className="w-3 h-3 rounded-full bg-stone-100"></div>
          <div className="w-3 h-3 rounded-full bg-stone-100"></div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-brand-primary mb-2">Pora wybrać postać!</h1>
          <p className="text-stone-500 font-medium italic">Kicek czy Szop? Decyzja należy do Ciebie.</p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-10">
          <button
            onClick={() => setCharacter('Kicek')}
            className={cn(
              "p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3",
              character === 'Kicek' 
                ? "bg-orange-50 border-orange-500 ring-4 ring-orange-500/10" 
                : "border-stone-100 bg-stone-50 hover:bg-white hover:border-orange-200"
            )}
          >
            <span className="text-5xl drop-shadow-sm">🐰</span>
            <span className="font-black text-xl text-brand-primary uppercase tracking-wider">Kicek</span>
          </button>
          
          <button
            onClick={() => setCharacter('Szop')}
            className={cn(
              "p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3",
              character === 'Szop' 
                ? "bg-orange-50 border-orange-500 ring-4 ring-orange-500/10" 
                : "border-stone-100 bg-stone-50 hover:bg-white hover:border-orange-200"
            )}
          >
            <span className="text-5xl drop-shadow-sm">🦝</span>
            <span className="font-black text-xl text-brand-primary uppercase tracking-wider">Szop</span>
          </button>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                placeholder="Min. 6 znaków"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
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
                <UserPlus className="w-6 h-6" />
                <span>Utwórz konto</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-stone-400 font-medium">
          Masz już konto?{' '}
          <Link to="/login" className="text-orange-600 font-black hover:underline underline-offset-4">
            Zaloguj się
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
