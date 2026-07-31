import React from 'react';
import { clsx } from 'clsx';
import { OrderStatus } from '@/types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'amber' | 'emerald' | 'rose' | 'slate' | 'blue' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'md',
  className,
}) => {
  const base = 'inline-flex items-center font-semibold rounded-full border';

  const variants = {
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    rose: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
    blue: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-xs px-3 py-1',
    lg: 'text-sm px-4 py-1.5 font-bold',
  };

  return <span className={clsx(base, variants[variant], sizes[size], className)}>{children}</span>;
};

export const OrderStatusBadge: React.FC<{ status: OrderStatus; size?: 'sm' | 'md' | 'lg' }> = ({
  status,
  size = 'md',
}) => {
  switch (status) {
    case 'PREPARING':
      return <Badge variant="amber" size={size} className="animate-pulse">PREPARING</Badge>;
    case 'READY':
      return <Badge variant="emerald" size={size}>READY</Badge>;
    case 'COMPLETED':
      return <Badge variant="blue" size={size}>COMPLETED</Badge>;
    case 'CANCELLED':
      return <Badge variant="rose" size={size}>CANCELLED</Badge>;
    default:
      return <Badge variant="slate" size={size}>{status}</Badge>;
  }
};
