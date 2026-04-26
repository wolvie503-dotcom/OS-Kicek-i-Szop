import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';
import { StatsProvider } from './contexts/StatsContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Quests from './pages/Quests';
import Activities from './pages/Activities';
import Food from './pages/Food';
import Budget from './pages/Budget';
import Inventory from './pages/Inventory';
import Gratitude from './pages/Gratitude';
import BottomNav from './components/BottomNav';
import { Sparkles } from 'lucide-react';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex flex-col items-center justify-center space-y-4">
        <Sparkles className="w-12 h-12 text-orange-600 animate-spin" />
        <p className="font-black text-brand-primary uppercase tracking-widest text-xs animate-pulse">
          Budzenie Kicka i Szopa...
        </p>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" replace />} />
        <Route path="/quests" element={user ? <Quests /> : <Navigate to="/login" replace />} />
        <Route path="/activities" element={user ? <Activities /> : <Navigate to="/login" replace />} />
        <Route path="/food" element={user ? <Food /> : <Navigate to="/login" replace />} />
        <Route path="/budget" element={user ? <Budget /> : <Navigate to="/login" replace />} />
        <Route path="/inventory" element={user ? <Inventory /> : <Navigate to="/login" replace />} />
        <Route path="/gratitude" element={user ? <Gratitude /> : <Navigate to="/login" replace />} />
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      </Routes>
      {user && <BottomNav />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <StatsProvider>
          <Router>
            <AppRoutes />
          </Router>
        </StatsProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
