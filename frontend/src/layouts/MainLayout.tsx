import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '@/services/api';
import {
  LayoutDashboard,
  ShoppingCart,
  ListOrdered,
  BookOpen,
  Users,
  Settings,
  QrCode,
  Tv,
  LogOut,
  Moon,
  Sparkles,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { colorTheme, setTheme } = useThemeStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isAdmin = user?.role?.name === 'ADMIN';

  // Fetch dynamic system settings
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
      <aside
        className={`${
          isCollapsed ? 'w-20' : 'w-64'
        } bg-white dark:bg-slate-900/90 border-r border-slate-200 dark:border-slate-800/80 flex flex-col justify-between p-3 shrink-0 h-screen sticky top-0 shadow-sm dark:shadow-none transition-all duration-300 z-30`}
      >
        <div className="space-y-5">
          {/* Top Branding & Collapse Toggle Section */}
          <div className="flex items-center justify-between px-1 py-1">
            {isCollapsed ? (
              <div className="flex flex-col items-center gap-2 w-full">
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-blue-500/30 text-blue-700 dark:text-blue-400 flex items-center justify-center shadow-md shrink-0 bg-blue-900">
                  <img src="/logo.png" alt="SJCEM Logo" className="w-full h-full object-cover" />
                </div>
                <button
                  onClick={() => setIsCollapsed(false)}
                  className="p-1.5 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Expand Sidebar"
                >
                  <PanelLeft className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-blue-500/30 text-blue-700 dark:text-blue-400 flex items-center justify-center shadow-md shrink-0 bg-blue-900">
                    <img src="/logo.png" alt="SJCEM Logo" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-extrabold text-sm text-slate-900 dark:text-white font-display truncate leading-tight">
                      {canteenName}
                    </h2>
                    <p className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 truncate">Campus Canteen POS</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsCollapsed(true)}
                  className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Collapse Sidebar"
                >
                  <PanelLeftClose className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map(({ path, label, icon: Icon, isExternal }) => {
              const isActive = location.pathname === path;
              return (
                <button
                  key={path}
                  title={label}
                  onClick={() => {
                    if (isExternal) {
                      window.open(path, '_blank');
                    } else {
                      navigate(path);
                    }
                  }}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-3.5 py-3'
                  } rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-blue-700 text-white shadow-lg shadow-blue-700/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                  {!isCollapsed && <span>{label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Theme & User Profile Section */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
          {/* Multi-Theme Preset Selector */}
          {!isCollapsed ? (
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-500" /> Color Theme
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setTheme('blue')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    colorTheme === 'blue' ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
                  }`}
                  title="Royal Blue (SJCEM Building)"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span> Blue
                </button>
                <button
                  onClick={() => setTheme('pink')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    colorTheme === 'pink' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
                  }`}
                  title="Rose Pink"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span> Pink
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    colorTheme === 'dark' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
                  }`}
                  title="Night Dark Mode"
                >
                  <Moon className="w-3 h-3 text-sky-400" /> Dark
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1.5 py-1">
              <button
                onClick={() => setTheme('blue')}
                className={`w-3 h-3 rounded-full bg-blue-600 ${colorTheme === 'blue' ? 'ring-2 ring-blue-400' : ''}`}
                title="Blue Theme"
              />
              <button
                onClick={() => setTheme('pink')}
                className={`w-3 h-3 rounded-full bg-rose-600 ${colorTheme === 'pink' ? 'ring-2 ring-rose-400' : ''}`}
                title="Pink Theme"
              />
              <button
                onClick={() => setTheme('dark')}
                className={`w-3 h-3 rounded-full bg-slate-900 ${colorTheme === 'dark' ? 'ring-2 ring-sky-400' : ''}`}
                title="Dark Theme"
              />
            </div>
          )}

          {!isCollapsed && (
            <div className="flex items-center justify-between px-2">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{user?.full_name || user?.username}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">
                  {isAdmin ? 'Owner / Admin' : 'Cashier'}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            title="Logout"
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center p-2.5' : 'gap-2 px-3.5 py-2.5'
            } rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Logout</span>}
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
