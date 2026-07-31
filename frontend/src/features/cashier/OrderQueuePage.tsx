import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/services/api';
import { Order, OrderStatus } from '@/types';
import { OrderStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Search, Clock, CheckCircle2, XCircle, RefreshCw, User, ShoppingBag } from 'lucide-react';

export const OrderQueuePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const queryClient = useQueryClient();

  useWebSocket('cashier', (event) => {
    if (['ORDER_CREATED', 'ORDER_UPDATED'].includes(event.event)) {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['orders', statusFilter, searchQuery],
    queryFn: () =>
      ordersApi.getOrders({
        status_filter: statusFilter === 'ALL' ? undefined : statusFilter,
        search: searchQuery || undefined,
      }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      ordersApi.updateStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['display-orders'] });
    },
  });

  const handleStatusChange = (orderId: string, status: OrderStatus) => {
    updateStatusMutation.mutate({ orderId, status });
  };

  const preparingOrders = orders.filter((o: Order) => o.status === 'PREPARING');
  const readyOrders = orders.filter((o: Order) => o.status === 'READY');
  const otherOrders = orders.filter((o: Order) => !['PREPARING', 'READY'].includes(o.status));

  const renderOrderCard = (order: Order) => (
    <div
      key={order.id}
      className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all shadow-sm ${
        order.status === 'PREPARING'
          ? 'bg-white dark:bg-slate-900/90 border-amber-500/40 ring-1 ring-amber-500/30'
          : order.status === 'READY'
          ? 'bg-white dark:bg-slate-900/90 border-emerald-500/40 ring-1 ring-emerald-500/30'
          : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-75'
      }`}
    >
      {/* Top Meta Bar */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-display">#{order.daily_order_number}</span>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300 font-semibold mt-1">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>{order.customer_name}</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-lg font-bold text-rose-600 dark:text-rose-400 font-display">₹{order.total_amount}</span>
          <p className="text-[10px] text-slate-400">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>

      {/* Items Summary */}
      <div className="py-2 border-y border-slate-100 dark:border-slate-800/80 space-y-1.5 max-h-36 overflow-y-auto">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
            <span>
              <strong className="text-slate-900 dark:text-white font-bold">{item.quantity}x</strong> {item.item_name}
            </span>
            <span className="text-slate-500 dark:text-slate-400">₹{item.total_price}</span>
          </div>
        ))}
      </div>

      {/* Actions Footer */}
      <div className="flex items-center gap-2 pt-1">
        {order.status === 'PREPARING' && (
          <Button
            onClick={() => handleStatusChange(order.id, 'READY')}
            variant="success"
            className="flex-1"
            size="sm"
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Mark READY (Move to Collect)
          </Button>
        )}

        {order.status === 'READY' && (
          <Button
            onClick={() => handleStatusChange(order.id, 'COMPLETED')}
            variant="primary"
            className="flex-1"
            size="sm"
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Mark Handed Over
          </Button>
        )}

        {['PREPARING', 'READY'].includes(order.status) && (
          <Button
            onClick={() => handleStatusChange(order.id, 'CANCELLED')}
            variant="danger"
            size="sm"
            className="px-3"
            title="Cancel Order"
          >
            <XCircle className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-slate-900 dark:text-slate-100">
      {/* Header Metrics Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-display">Live Order Queue</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage order preparation status & live customer notifications</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center gap-2 text-xs font-bold">
            <Clock className="w-4 h-4 animate-spin" /> Preparing: {preparingOrders.length}
          </div>
          <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" /> Please Collect: {readyOrders.length}
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search by Order # or Customer Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {['ALL', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st === 'READY' ? 'PLEASE COLLECT (READY)' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders View */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-slate-400 text-sm">Loading Order Queue...</div>
      ) : orders.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-2">
          <ShoppingBag className="w-12 h-12 stroke-[1.5]" />
          <p className="text-sm font-medium">No orders found</p>
        </div>
      ) : statusFilter === 'ALL' && !searchQuery ? (
        /* Grouped Sections View for ALL */
        <div className="space-y-8">
          {/* SECTION 1: PREPARING */}
          {preparingOrders.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-extrabold text-amber-500 flex items-center gap-2 font-display uppercase tracking-wider">
                <Clock className="w-5 h-5 animate-spin" /> Preparing Orders ({preparingOrders.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {preparingOrders.map(renderOrderCard)}
              </div>
            </div>
          )}

          {/* SECTION 2: PLEASE COLLECT (READY) */}
          {readyOrders.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-extrabold text-emerald-500 flex items-center gap-2 font-display uppercase tracking-wider">
                <CheckCircle2 className="w-5 h-5" /> Please Collect — Ready Orders ({readyOrders.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {readyOrders.map(renderOrderCard)}
              </div>
            </div>
          )}

          {/* SECTION 3: OTHER / HISTORY */}
          {otherOrders.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-extrabold text-slate-400 flex items-center gap-2 font-display uppercase tracking-wider">
                Completed & Cancelled History ({otherOrders.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherOrders.map(renderOrderCard)}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Standard Grid View for Filtered Results */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map(renderOrderCard)}
        </div>
      )}
    </div>
  );
};
