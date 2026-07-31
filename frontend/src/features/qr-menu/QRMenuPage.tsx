import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { menuApi, settingsApi } from '@/services/api';
import { useThemeStore } from '@/store/useThemeStore';
import { Search, Utensils, Sparkles, AlertCircle, Sun, Moon } from 'lucide-react';

export const QRMenuPage: React.FC = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { theme, toggleTheme } = useThemeStore();

  // Fetch Public Config Settings
  const { data: config } = useQuery({
    queryKey: ['system-config'],
    queryFn: () => settingsApi.getConfig(),
  });

  const canteenTitle = config?.canteen_name || 'Campus Canteen';
  const tagline = config?.canteen_tagline || 'Digital Menu • View Only';

  // Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => menuApi.getCategories(true),
  });

  // Menu Items
  const { data: menuItems = [], isLoading } = useQuery({
    queryKey: ['menu', selectedCategoryId, searchQuery],
    queryFn: () =>
      menuApi.getMenuItems({
        category_id: selectedCategoryId || undefined,
        search: searchQuery || undefined,
      }),
  });

  const todaysSpecials = menuItems.filter((i) => i.is_todays_special);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-12 transition-colors duration-200">
      {/* Top Bar with Theme Toggle */}
      <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-600/10 text-rose-600 dark:text-rose-500 flex items-center justify-center font-bold">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{canteenTitle}</h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Digital Menu</p>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
          title="Toggle Day / Night Mode"
        >
          {theme === 'light' ? (
            <>
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Day ☀️</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-sky-400" />
              <span>Night 🌙</span>
            </>
          )}
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 space-y-5">
        {/* Header Banner */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center mx-auto shadow-md shadow-rose-600/20 mb-2">
            <Utensils className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white font-display">{canteenTitle}</h1>
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{tagline}</p>
        </div>

        {/* View-Only Banner */}
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Please order and pay directly at the Cashier counter.</span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search items, beverages, snacks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-rose-500 shadow-sm"
          />
        </div>

        {/* Today's Special Highlights */}
        {todaysSpecials.length > 0 && !searchQuery && !selectedCategoryId && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" /> Today's Chef Specials
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {todaysSpecials.map((item) => (
                <div
                  key={item.id}
                  className="w-44 shrink-0 bg-white dark:bg-slate-900/80 p-3 rounded-2xl border border-amber-500/30 shadow-sm space-y-2"
                >
                  <div className="h-20 w-full rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-amber-500 text-lg font-display">
                        {item.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">{item.name}</h4>
                  <p className="text-xs font-extrabold text-rose-600 dark:text-rose-400 font-display">₹{item.price}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategoryId === null
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategoryId === cat.id
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Menu List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading Menu...</div>
          ) : menuItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">No menu items found</div>
          ) : (
            menuItems.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 ${
                  !item.is_available ? 'opacity-40 grayscale' : ''
                }`}
              >
                <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 text-base font-display">
                      {item.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{item.name}</h4>
                    <span className="font-extrabold text-sm text-rose-600 dark:text-rose-400 font-display">₹{item.price}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{item.description || 'Freshly prepared'}</p>
                  {!item.is_available && (
                    <span className="inline-block mt-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded">
                      NOT AVAILABLE
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
