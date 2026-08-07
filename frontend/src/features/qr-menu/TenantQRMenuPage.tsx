import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { menuApi, settingsApi } from '@/services/api';
import { useThemeStore } from '@/store/useThemeStore';
import { Search, Sparkles, Sun, Moon, ChevronRight, Clock, Coffee, UtensilsCrossed } from 'lucide-react';
import { MenuItem } from '@/types';

export const TenantQRMenuPage: React.FC = () => {
  const { canteenSlug } = useParams<{ canteenSlug?: string }>();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [vegFilter, setVegFilter] = useState<'ALL' | 'VEG' | 'NON_VEG'>('ALL');
  const { theme, toggleTheme } = useThemeStore();

  // Fetch Public Config Settings
  const { data: config } = useQuery({
    queryKey: ['system-config'],
    queryFn: () => settingsApi.getConfig(),
  });

  const canteenTitle = config?.canteen_name || (canteenSlug ? canteenSlug.replace(/-/g, ' ').toUpperCase() : 'Campus Smart Canteen');

  // Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => menuApi.getCategories(true),
  });

  // Menu Items
  const { data: menuItemsRaw = [], isLoading } = useQuery({
    queryKey: ['menu', selectedCategoryId, searchQuery],
    queryFn: () =>
      menuApi.getMenuItems({
        category_id: selectedCategoryId || undefined,
        search: searchQuery || undefined,
      }),
  });

  // Apply Veg / Non-Veg Filtering
  const menuItems = menuItemsRaw.filter((i) => {
    if (vegFilter === 'VEG') return i.is_veg !== false;
    if (vegFilter === 'NON_VEG') return i.is_veg === false;
    return true;
  });

  // Group items by meal time slots
  const breakfastItems = menuItems.filter((i) => {
    if (!i.available_start_time) return true; // Available all day
    return i.available_start_time <= '11:00';
  });

  const lunchItems = menuItems.filter((i) => {
    if (!i.available_end_time) return true;
    return (i.available_start_time || '00:00') <= '15:00' && (i.available_end_time || '23:59') >= '12:00';
  });

  const eveningSnacksItems = menuItems.filter((i) => {
    return i.is_todays_special || i.price <= 60 || (i.category?.name || '').toLowerCase().includes('snack') || (i.category?.name || '').toLowerCase().includes('beverage') || (i.category?.name || '').toLowerCase().includes('sweet');
  });

  const renderItemCard = (item: MenuItem) => (
    <div
      key={item.id}
      className={`w-40 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-sm flex flex-col justify-between space-y-2.5 transition-all ${
        !item.is_available ? 'opacity-40 grayscale' : ''
      }`}
    >
      <div className="space-y-2">
        {/* Photo Box with Top-Left FSSAI Logo & Top-Right Special Tag */}
        <div className="h-24 w-full rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden relative border border-slate-200 dark:border-slate-700/50">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 text-base font-display bg-slate-100 dark:bg-slate-800">
              {item.name.substring(0, 2).toUpperCase()}
            </div>
          )}

          {/* TOP-LEFT: OFFICIAL FSSAI VEG/NON-VEG LOGO */}
          <div className="absolute top-1.5 left-1.5 flex items-center gap-1 z-20">
            <div
              className={`w-3.5 h-3.5 rounded-sm border-2 ${
                item.is_veg !== false ? 'border-emerald-600' : 'border-rose-600'
              } bg-white dark:bg-slate-900 flex items-center justify-center p-0.5 shadow`}
              title={item.is_veg !== false ? 'Pure Veg' : 'Non-Veg'}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${item.is_veg !== false ? 'bg-emerald-600' : 'bg-rose-600'}`} />
            </div>
          </div>

          {/* TOP-RIGHT: TODAY'S SPECIAL BADGE */}
          {item.is_todays_special && (
            <span className="absolute top-1.5 right-1.5 bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow z-20">
              <Sparkles className="w-2.5 h-2.5" /> Special
            </span>
          )}

          {/* UNAVAILABLE / SOLD OUT OVERLAY BLUR */}
          {!item.is_available && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[1px] flex items-center justify-center text-rose-400 font-black text-[10px] uppercase tracking-wider z-20">
              Sold Out
            </div>
          )}
        </div>

        {/* Name & Description */}
        <div>
          <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">{item.name}</h4>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1">{item.description || 'Freshly prepared'}</p>
        </div>
      </div>

      {/* Price & Availability Status */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="font-extrabold text-xs text-blue-700 dark:text-blue-400 font-display">₹{item.price}</span>
        <span
          className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
            item.is_available
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-500/10 text-red-500'
          }`}
        >
          {item.is_available ? 'Available' : 'Sold Out'}
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-16 transition-colors duration-200">
      {/* 1. TOP HEADER BAR */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-blue-500/30 shrink-0 shadow-sm bg-blue-900">
              <img src="/logo.png" alt="SJCEM Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 dark:text-white font-display tracking-tight leading-tight">
                {canteenTitle} Menu
              </h1>
              <p className="text-[10px] text-blue-700 dark:text-blue-400 font-semibold">Digital Self-Service Menu</p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-colors flex items-center gap-1"
            title="Toggle Day / Night Mode"
          >
            {theme === 'light' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-sky-400" />}
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-5">
        {/* 2. SEARCH BAR */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search food or beverage..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
          />
        </div>

        {/* 3. DIETARY VEG / NON-VEG FSSAI QUICK FILTERS */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVegFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border ${
              vegFilter === 'ALL'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
            }`}
          >
            All Items
          </button>

          <button
            onClick={() => setVegFilter(vegFilter === 'VEG' ? 'ALL' : 'VEG')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 border ${
              vegFilter === 'VEG'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="w-3.5 h-3.5 rounded-sm border-2 border-emerald-600 bg-white dark:bg-slate-900 flex items-center justify-center p-0.5 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            </div>
            <span>Veg Only</span>
          </button>

          <button
            onClick={() => setVegFilter(vegFilter === 'NON_VEG' ? 'ALL' : 'NON_VEG')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 border ${
              vegFilter === 'NON_VEG'
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="w-3.5 h-3.5 rounded-sm border-2 border-rose-600 bg-white dark:bg-slate-900 flex items-center justify-center p-0.5 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            </div>
            <span>Non-Veg</span>
          </button>
        </div>

        {/* 4. CATEGORY CHIPS ROW (Horizontal Scroll ↔️) */}
        <div className="relative">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pr-6">
            <button
              onClick={() => setSelectedCategoryId(null)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategoryId === null
                  ? 'bg-blue-700 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategoryId === cat.id
                    ? 'bg-blue-700 text-white shadow-md'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none bg-gradient-to-l from-slate-50 dark:from-slate-950 to-transparent pl-4 pr-1">
            <ChevronRight className="w-4 h-4 text-slate-400 animate-pulse" />
          </div>
        </div>

        {/* MAIN MEAL SECTIONS OR FILTERED GRID */}
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-xs">Loading Menu...</div>
        ) : searchQuery || selectedCategoryId || vegFilter !== 'ALL' ? (
          /* FILTERED / SEARCHED GRID VIEW */
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {searchQuery
                ? `Search Results for "${searchQuery}"`
                : vegFilter !== 'ALL'
                ? `${vegFilter === 'VEG' ? 'Vegetarian' : 'Non-Vegetarian'} Items`
                : 'Category Items'}{' '}
              ({menuItems.length})
            </h3>

            {menuItems.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">No matching items found</div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {menuItems.map((item) => renderItemCard(item))}
              </div>
            )}
          </div>
        ) : (
          /* VERTICAL MEAL TIME SECTIONS WITH HORIZONTAL CAROUSELS */
          <div className="space-y-6">
            {/* SECTION 1: Breakfast (8am - 11am) */}
            {breakfastItems.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-display">Breakfast</h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 8am - 11am
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {breakfastItems.map((item) => renderItemCard(item))}
                </div>
              </div>
            )}

            {/* SECTION 2: Lunch (12pm - 3pm) */}
            {lunchItems.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-display">Lunch</h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 12pm - 3pm
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {lunchItems.map((item) => renderItemCard(item))}
                </div>
              </div>
            )}

            {/* SECTION 3: Evening Snacks (3pm - 6pm) */}
            {eveningSnacksItems.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-rose-500" />
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-display">Evening Snacks</h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 3pm - 6pm
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {eveningSnacksItems.map((item) => renderItemCard(item))}
                </div>
              </div>
            )}

            {/* SECTION 4: ALL CATEGORIES CAROUSELS */}
            {categories.map((cat) => {
              const catItems = menuItems.filter((i) => i.category_id === cat.id);
              if (catItems.length === 0) return null;
              return (
                <div key={cat.id} className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-display">{cat.name}</h3>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>

                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                    {catItems.map((item) => renderItemCard(item))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
