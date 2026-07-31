import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{label}</label>}
        <div className="relative flex items-center">
          {leftIcon && <div className="absolute left-3.5 text-slate-400 pointer-events-none">{leftIcon}</div>}
          <input
            ref={ref}
            className={clsx(
              'w-full bg-white dark:bg-slate-900 border text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error ? 'border-red-500' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700',
              className
            )}
            {...props}
          />
          {rightIcon && <div className="absolute right-3.5 text-slate-400">{rightIcon}</div>}
        </div>
        {error && <p className="text-xs text-red-500 dark:text-red-400 font-medium">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
