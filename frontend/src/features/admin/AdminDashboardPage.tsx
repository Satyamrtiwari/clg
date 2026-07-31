import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  DollarSign,
  ArrowUpRight,
  Sparkles,
  Tv,
  ShoppingCart,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // Fetch Analytics
  const { data: analytics } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => analyticsApi.getDashboard(),
    refetchInterval: 10000,
  });

  const todayRevenue = analytics?.today_revenue ?? 0;
  const todayOrdersCount = analytics?.today_orders_count ?? 0;
  const activeQueueCount = analytics?.active_queue_count ?? 0;
  const avgOrderValue = analytics?.average_order_value ?? 0;
  const topItems = analytics?.top_items ?? [];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto text-slate-900 dark:text-slate-100">
      {/* Top Banner Header matching Theme */}
      <div className="bg-gradient-to-r from-rose-500/10 via-white to-white dark:from-rose-600/20 dark:via-slate-900 dark:to-slate-900 p-8 rounded-3xl border border-rose-500/20 dark:border-rose-500/30 shadow-sm dark:shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Live Canteen Telemetry
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-display">Canteen Performance Dashboard</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Real-time metrics, daily revenue & order processing analytics</p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <Button onClick={() => navigate('/pos')} size="lg" variant="primary" leftIcon={<ShoppingCart className="w-5 h-5" />}>
            Launch Cashier POS
          </Button>
          <Button
            onClick={() => window.open('/display', '_blank')}
            size="lg"
            variant="outline"
            className="text-slate-900 dark:text-white font-bold border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm"
            leftIcon={<Tv className="w-5 h-5 text-slate-700 dark:text-slate-300" />}
          >
            TV Order Display
          </Button>
        </div>
      </div>

      {/* 4 Core Metric Cards with Day & Night styling */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Today's Revenue */}
        <div className="bg-white dark:bg-slate-900/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Today's Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-display">₹{todayRevenue}</div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <TrendingUp className="w-3.5 h-3.5" /> Gross sales today
          </div>
        </div>

        {/* Card 2: Today's Orders */}
        <div className="bg-white dark:bg-slate-900/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Today's Orders</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-display">{todayOrdersCount}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {analytics?.completed_orders_count ?? 0} Completed
          </div>
        </div>

        {/* Card 3: Active Queue */}
        <div className="bg-white dark:bg-slate-900/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Active Queue</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400 font-display">{activeQueueCount}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Preparing & Ready
          </div>
        </div>

        {/* Card 4: Avg Order Value */}
        <div className="bg-white dark:bg-slate-900/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Avg Order Value</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-display">₹{avgOrderValue}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Per order average
          </div>
        </div>
      </div>

      {/* Top Selling Menu Items List */}
      <div className="bg-white dark:bg-slate-900/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white font-display">Top Selling Menu Items Today</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Best-performing canteen food & beverages</p>
          </div>
          <Button onClick={() => navigate('/admin/menu')} variant="ghost" size="sm" rightIcon={<ArrowUpRight className="w-4 h-4" />}>
            Manage Menu
          </Button>
        </div>

        {topItems.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs font-medium">No sales recorded today yet</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {topItems.map((item: any, idx: number) => (
              <div key={item.item_name || idx} className="py-3 flex justify-between items-center text-sm font-medium">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-rose-600 dark:text-rose-400 font-display">
                    #{idx + 1}
                  </span>
                  <span className="text-slate-900 dark:text-slate-100 font-semibold">{item.item_name}</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{item.total_quantity} sold</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-display w-20 text-right">₹{item.total_revenue}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
