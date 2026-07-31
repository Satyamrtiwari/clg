import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '@/services/api';
import {
  Utensils,
  LayoutDashboard,
  ShoppingCart,
  ListOrdered,
  BookOpen,
  Users,
  Settings,
  QrCode,
  Tv,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const isAdmin = user?.role?.name === 'ADMIN';

  // Fetch dynamic system settings to check cashier_can_edit_menu permission
  const { data: config } = useQuery({
    queryKey: ['system-config'],
    queryFn: () => settingsApi.getConfig(),
  });

  const canCashierEditMenu = config?.cashier_can_edit_menu ?? false;
  const canShowMenuTab = isAdmin || canCashierEditMenu;

  const canteenName = config?.canteen_name || 'Campus Smart Canteen';

  const navItems = [
    ...(isAdmin
      ? [{ path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard }]
      : []),
    { path: '/pos', label: 'New Order', icon: ShoppingCart },
    { path: '/orders', label: 'Orders', icon: ListOrdered },
    ...(canShowMenuTab
      ? [{ path: '/admin/menu', label: 'Menu', icon: BookOpen }]
      : []),
    ...(isAdmin
      ? [{ path: '/admin/staff', label: 'Staff', icon: Users }]
      : []),
    ...(isAdmin
      ? [{ path: '/admin/settings', label: 'Settings', icon: Settings }]
      : []),
    { path: '/qr-menu', label: 'QR Menu', icon: QrCode, isExternal: true },
    { path: '/display', label: 'Customer Display', icon: Tv, isExternal: true },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans transition-colors duration-200">
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-white dark:bg-slate-900/90 border-r border-slate-200 dark:border-slate-800/80 flex flex-col justify-between p-4 shrink-0 h-screen sticky top-0 shadow-sm dark:shadow-none">
        <div className="space-y-6">
          {/* Top Branding Section */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-10 h-10 rounded-xl bg-rose-600/10 dark:bg-rose-600/20 border border-rose-500/20 dark:border-rose-500/30 text-rose-600 dark:text-rose-500 flex items-center justify-center shadow-sm shrink-0">
              <Utensils className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-extrabold text-base text-slate-900 dark:text-white font-display truncate leading-tight">{canteenName}</h2>
              <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">Canteen POS</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map(({ path, label, icon: Icon, isExternal }) => {
              const isActive = location.pathname === path;
              return (
                <button
                  key={path}
                  onClick={() => {
                    if (isExternal) {
                      window.open(path, '_blank');
                    } else {
                      navigate(path);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Theme & User Profile Section */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          {/* Day / Night Theme Toggle Button with Icon */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
            title="Toggle Day / Night Mode"
          >
            <span className="flex items-center gap-2">
              {theme === 'light' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-sky-400" />
              )}
              <span>{theme === 'light' ? 'Day Mode ☀️' : 'Night Mode 🌙'}</span>
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
              {theme === 'light' ? 'DAY' : 'NIGHT'}
            </span>
          </button>

          <div className="flex items-center justify-between px-2">
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{user?.full_name || user?.username}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">{isAdmin ? 'Owner / Admin' : 'Cashier'}</p>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT AREA */}
      <main className="flex-1 bg-slate-50 dark:bg-slate-950 min-w-0 overflow-y-auto h-screen transition-colors duration-200">
        <Outlet />
      </main>
    </div>
  );
};
