import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Lock, User as UserIcon, ShieldAlert, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { colorTheme, cycleTheme } = useThemeStore();

  const executeLogin = async (u: string, p: string) => {
    setError('');
    setLoading(true);

    try {
      const res = await authApi.login({ username: u, password: p });
      setAuth(res.user, res.access_token);
      
      if (res.user.role.name === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/pos');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeLogin(username, password);
  };

  const handleQuickLogin = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    executeLogin(user, pass);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden transition-colors duration-200">
      {/* Top Right Theme Preset Cycle Button */}
      <button
        onClick={cycleTheme}
        className="absolute top-6 right-6 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md text-slate-700 dark:text-slate-300 hover:scale-105 transition-all flex items-center gap-2 text-xs font-bold"
        title="Cycle Color Theme (Blue / Pink / Dark)"
      >
        <Sparkles className="w-4 h-4 text-blue-600" />
        <span className="capitalize">{colorTheme} Theme</span>
        <span className="text-[10px] text-slate-400 font-normal">(Click to switch)</span>
      </button>

      {/* Background Decorator Gradients */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-8 z-10">
        {/* Header Branding with SJCEM Building Logo Image */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl overflow-hidden border border-blue-500/40 shadow-xl shadow-blue-950/20 bg-blue-900 mx-auto">
            <img src="/logo.png" alt="SJCEM Building Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight">Smart Canteen POS</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Campus Canteen Order & Display System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-2xl backdrop-blur-xl space-y-6">
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm font-medium">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              leftIcon={<UserIcon className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <Button type="submit" className="w-full" size="lg" isLoading={loading}>
              Sign In to POS
            </Button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <p className="text-xs text-center font-semibold text-slate-400 uppercase tracking-wider">Quick Demo Login</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 transition-colors text-center"
              >
                🔑 Admin Mode
                <span className="block text-[10px] text-slate-500 dark:text-slate-400">admin / admin123</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('cashier', 'cashier123')}
                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 transition-colors text-center"
              >
                🛒 Cashier Mode
                <span className="block text-[10px] text-slate-500 dark:text-slate-400">cashier / cashier123</span>
              </button>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500 dark:text-slate-400">
          Campus POS System • SJCEM Edition
        </div>
      </div>
    </div>
  );
};
