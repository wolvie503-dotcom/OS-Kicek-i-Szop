import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Wykrywanie czy Supabase jest skonfigurowany
const isConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.length > 20
);

// Prawdziwy klient lub null
const realClient = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Mocking helper for development
 */
export const isMockMode = !isConfigured;

export const mockUser = {
  id: 'mock-user-id',
  email: 'kicek-szop@example.com',
  user_metadata: {
    character: '🐰',
    name: 'Kicek'
  },
  aud: 'authenticated',
  role: 'authenticated',
};

// Pancerny "bezpiecznik" - jeśli supabase nie działa, zwracamy obiekt o tym samym interfejsie
export const supabase = realClient || ({
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithPassword: async () => ({ data: { user: mockUser, session: {} }, error: null }),
    signUp: async () => ({ data: { user: mockUser, session: {} }, error: null }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    getUser: async () => ({ data: { user: mockUser }, error: null }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: {}, error: null }),
        maybeSingle: async () => ({ data: {}, error: null }),
      }),
    }),
    upsert: async () => ({ data: {}, error: null }),
    update: () => ({ eq: async () => ({ data: {}, error: null }) }),
  }),
} as any);
