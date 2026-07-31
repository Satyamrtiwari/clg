import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/services/api';
import api from '@/lib/axios';
import { User } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Users, UserPlus, ShieldCheck, CheckCircle2, User as UserIcon, Lock } from 'lucide-react';

export const StaffManagementPage: React.FC = () => {
  const [canEditMenu, setCanEditMenu] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);

  // Form
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [roleName, setRoleName] = useState('CASHIER');
  const [loading, setLoading] = useState(false);

  const queryClient = useQueryClient();

  // Fetch settings config
  const { data: config } = useQuery({
    queryKey: ['system-config'],
    queryFn: () => settingsApi.getConfig(),
  });

  useEffect(() => {
    if (config) {
      setCanEditMenu(config.cashier_can_edit_menu);
    }
  }, [config]);

  // Fetch Staff Users
  const { data: staffUsers = [], isLoading: isStaffLoading } = useQuery({
    queryKey: ['staff-users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data as User[];
    },
  });

  const handleTogglePermission = async (newValue: boolean) => {
    setCanEditMenu(newValue);
    try {
      await settingsApi.updateSetting('cashier_permissions', {
        can_edit_menu: newValue,
        can_cancel_order: true,
      });
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
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create staff user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-display">Staff & Permission Management</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage canteen staff accounts and cashier operational permissions</p>
        </div>

        <Button onClick={() => setIsAddStaffOpen(true)} variant="primary" size="md" leftIcon={<UserPlus className="w-4 h-4" />}>
          Add Staff Member
        </Button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" /> Cashier permission updated successfully!
        </div>
      )}

      {/* CASHIER PERMISSIONS CARD */}
      <div className="bg-white dark:bg-slate-900/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-display">Cashier Permissions</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Control operational capabilities granted to the Cashier role</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Allow cashiers to edit menu</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">When off, only owners manage the menu</p>
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
              <div key={user.id} className="py-3 flex items-center justify-between">
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
            placeholder="Password..."
            leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Role</label>
            <select
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500"
            >
              <option value="CASHIER">Cashier</option>
              <option value="ADMIN">Owner / Admin</option>
            </select>
          </div>

          <Button type="submit" isLoading={loading} size="lg" className="w-full">
            Create Staff Account
          </Button>
        </form>
      </Modal>
    </div>
  );
};
