import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/services/api';
import api from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { User } from '@/types';
import { Users, UserPlus, ShieldCheck, User as UserIcon, Lock, CheckCircle, Trash2, AlertTriangle } from 'lucide-react';

export const StaffManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [deleteStaffTarget, setDeleteStaffTarget] = useState<{ id: string; name: string } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [roleName, setRoleName] = useState<'ADMIN' | 'CASHIER'>('CASHIER');

  // 1. Fetch system settings
  const { data: config } = useQuery({
    queryKey: ['system-config'],
    queryFn: () => settingsApi.getConfig(),
  });

  const canEditMenu = config?.cashier_can_edit_menu ?? false;

  // 2. Fetch list of staff users
  const { data: staffUsers = [], isLoading: isStaffLoading } = useQuery<User[]>({
    queryKey: ['staff-users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data;
    },
  });

  // Toggle Cashier Menu Editing Permission
  const handleTogglePermission = async (newValue: boolean) => {
    try {
      await settingsApi.updateSetting('cashier_can_edit_menu', newValue);
      queryClient.invalidateQueries({ queryKey: ['system-config'] });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert('Failed to update permission');
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    try {
      await api.post('/users', {
        username,
        full_name: fullName,
        password,
        role_name: roleName,
      });

      queryClient.invalidateQueries({ queryKey: ['staff-users'] });
      setIsAddStaffOpen(false);
      setUsername('');
      setFullName('');
      setPassword('');
      setRoleName('CASHIER');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create staff account');
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteStaff = async () => {
    if (!deleteStaffTarget) return;

    try {
      await api.delete(`/users/${deleteStaffTarget.id}`);
      queryClient.invalidateQueries({ queryKey: ['staff-users'] });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete staff member');
    } finally {
      setDeleteStaffTarget(null);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white font-display tracking-tight">Staff & Permissions</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage cashier accounts and operational feature access.</p>
        </div>

        <Button onClick={() => setIsAddStaffOpen(true)} className="self-start sm:self-auto gap-2 shadow-lg shadow-rose-600/20">
          <UserPlus className="w-4 h-4" /> Add Staff Member
        </Button>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-medium animate-fadeIn">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>Staff settings updated successfully!</span>
        </div>
      )}

      {/* CASHIER PERMISSIONS CARD */}
      <div className="bg-white dark:bg-slate-900/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-display">Cashier Permissions</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Control what cashier roles are allowed to modify in the POS.</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Allow Cashiers to Edit Menu</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              When enabled, cashiers can add, edit, or toggle availability of menu items.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={canEditMenu}
              onChange={(e) => handleTogglePermission(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
          </label>
        </div>
      </div>

      {/* STAFF MEMBERS LIST */}
      <div className="bg-white dark:bg-slate-900/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <Users className="w-5 h-5 text-rose-600 dark:text-rose-500" /> Active Staff Accounts
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{staffUsers.length} total staff</span>
        </div>

        {isStaffLoading ? (
          <div className="py-8 text-center text-slate-400 text-xs">Loading staff users...</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {staffUsers.map((user) => (
              <div key={user.id} className="py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-rose-600 dark:text-rose-400 font-display text-sm">
                    {user.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{user.full_name || user.username}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">@{user.username} • {user.email || 'No email'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                    user.role.name === 'ADMIN'
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                      : 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30'
                  }`}>
                    {user.role.name === 'ADMIN' ? 'Owner / Admin' : 'Cashier'}
                  </span>

                  {user.role.name !== 'ADMIN' && (
                    <button
                      onClick={() => setDeleteStaffTarget({ id: user.id, name: user.full_name || user.username })}
                      className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white transition-colors"
                      title="Delete Staff Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD STAFF MODAL */}
      <Modal
        isOpen={isAddStaffOpen}
        onClose={() => setIsAddStaffOpen(false)}
        title="Create New Staff Member"
        maxWidth="sm"
      >
        <form onSubmit={handleAddStaff} className="space-y-4">
          <Input
            label="Username *"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. cashier2"
            leftIcon={<UserIcon className="w-4 h-4 text-slate-400" />}
            required
          />

          <Input
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Rahul Sharma"
          />

          <Input
            label="Password *"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Assign Role</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRoleName('CASHIER')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  roleName === 'CASHIER'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                🛒 Cashier
              </button>
              <button
                type="button"
                onClick={() => setRoleName('ADMIN')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  roleName === 'ADMIN'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                🔑 Admin
              </button>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" type="button" onClick={() => setIsAddStaffOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={loading}>
              Create Staff Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE STAFF CONFIRMATION MODAL */}
      <Modal
        isOpen={!!deleteStaffTarget}
        onClose={() => setDeleteStaffTarget(null)}
        title="Delete Staff Member?"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-medium">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
            <span>Are you sure you want to remove staff member <strong>"{deleteStaffTarget?.name}"</strong>? This account will no longer be able to log in.</span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setDeleteStaffTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDeleteStaff}>
              Yes, Delete Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
