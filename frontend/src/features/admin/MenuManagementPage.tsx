import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { menuApi } from '@/services/api';
import { MenuItem, Category } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Plus, Edit, Sparkles, FolderPlus, Clock, Calendar } from 'lucide-react';

const DAYS_OF_WEEK = [
  { id: 'MONDAY', label: 'Mon' },
  { id: 'TUESDAY', label: 'Tue' },
  { id: 'WEDNESDAY', label: 'Wed' },
  { id: 'THURSDAY', label: 'Thu' },
  { id: 'FRIDAY', label: 'Fri' },
  { id: 'SATURDAY', label: 'Sat' },
  { id: 'SUNDAY', label: 'Sun' },
];

export const MenuManagementPage: React.FC = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isTodaysSpecial, setIsTodaysSpecial] = useState(false);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState('10');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Category Form
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');

  const queryClient = useQueryClient();

  // Queries
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => menuApi.getCategories(false),
  });

  const { data: menuItems = [], isLoading } = useQuery({
    queryKey: ['menu', selectedCategoryId],
    queryFn: () => menuApi.getMenuItems({ category_id: selectedCategoryId || undefined }),
  });

  // Mutations
  const toggleAvailabilityMutation = useMutation({
    mutationFn: (id: string) => menuApi.toggleAvailability(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menu'] }),
  });

  const handleOpenItemModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setName(item.name);
      setDescription(item.description || '');
      setPrice(item.price.toString());
      setCategoryId(item.category_id);
      setImageUrl(item.image_url || '');
      setIsTodaysSpecial(item.is_todays_special);
      setPrepTimeMinutes(item.prep_time_minutes.toString());
      setSelectedDays(item.available_days || []);
      setStartTime(item.available_start_time || '');
      setEndTime(item.available_end_time || '');
    } else {
      setEditingItem(null);
      setName('');
      setDescription('');
      setPrice('');
      setCategoryId(categories[0]?.id || '');
      setImageUrl('');
      setIsTodaysSpecial(false);
      setPrepTimeMinutes('10');
      setSelectedDays([]);
      setStartTime('');
      setEndTime('');
    }
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !categoryId) return;

    const payload = {
      name,
      description,
      price: parseFloat(price),
      category_id: categoryId,
      image_url: imageUrl || undefined,
      is_todays_special: isTodaysSpecial,
      prep_time_minutes: parseInt(prepTimeMinutes) || 10,
      available_days: selectedDays,
      available_start_time: startTime || undefined,
      available_end_time: endTime || undefined,
    };

    if (editingItem) {
      await menuApi.updateMenuItem(editingItem.id, payload);
    } else {
      await menuApi.createMenuItem(payload);
    }

    queryClient.invalidateQueries({ queryKey: ['menu'] });
    setIsItemModalOpen(false);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName) return;

    await menuApi.createCategory({
      name: categoryName,
      description: categoryDesc,
    });

    queryClient.invalidateQueries({ queryKey: ['categories'] });
    setIsCategoryModalOpen(false);
    setCategoryName('');
    setCategoryDesc('');
  };

  const toggleDaySelection = (dayId: string) => {
    if (selectedDays.includes(dayId)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-slate-900 dark:text-slate-100">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-display">Menu & Category Manager</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Configure prices, availability, schedules, and specials</p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => setIsCategoryModalOpen(true)} variant="ghost" size="md" leftIcon={<FolderPlus className="w-4 h-4" />}>
            Add Category
          </Button>
          <Button onClick={() => handleOpenItemModal()} variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
            Add Menu Item
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <button
          onClick={() => setSelectedCategoryId(null)}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            selectedCategoryId === null
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          All Items ({menuItems.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoryId(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategoryId === cat.id
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-slate-400 text-sm">Loading Menu Items...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition-all bg-white dark:bg-slate-900/80 shadow-sm ${
                !item.is_available ? 'opacity-50 border-slate-200 dark:border-slate-800' : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="space-y-2">
                <div className="h-24 w-full rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold font-display text-2xl">
                      {item.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  {item.is_todays_special && (
                    <span className="absolute top-2 right-2 bg-amber-500 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                      <Sparkles className="w-3 h-3" /> Special
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{item.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{item.description || 'No description'}</p>
                </div>

                {/* Day / Time Schedule Badges if any */}
                {(item.available_days?.length! > 0 || item.available_start_time) && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {item.available_days?.length! > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                        {item.available_days?.length} Days
                      </span>
                    )}
                    {item.available_start_time && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        {item.available_start_time}-{item.available_end_time}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-lg font-extrabold text-slate-900 dark:text-white font-display">₹{item.price}</span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAvailabilityMutation.mutate(item.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                      item.is_available
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'
                    }`}
                  >
                    {item.is_available ? 'Available' : 'Unavailable'}
                  </button>

                  <button
                    onClick={() => handleOpenItemModal(item)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD/EDIT ITEM MODAL */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title={editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          <Input label="Item Name *" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Price (₹) *" type="number" step="0.5" value={price} onChange={(e) => setPrice(e.target.value)} required />
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <Input label="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />

          {/* Day Availability Section (Optional) */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-rose-500" /> Day Availability (Optional)
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Leave unselected to make available every day</p>
            <div className="flex flex-wrap gap-1.5">
              {DAYS_OF_WEEK.map((d) => {
                const isSelected = selectedDays.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDaySelection(d.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      isSelected
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Schedule Section (Optional) */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" /> Time Schedule (Optional)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Start Time (e.g. 08:00)" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              <Input label="End Time (e.g. 11:00)" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_special"
              checked={isTodaysSpecial}
              onChange={(e) => setIsTodaysSpecial(e.target.checked)}
              className="w-4 h-4 accent-rose-600 rounded"
            />
            <label htmlFor="is_special" className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Mark as Today's Special
            </label>
          </div>

          <Button type="submit" size="lg" className="w-full">
            {editingItem ? 'Save Changes' : 'Create Item'}
          </Button>
        </form>
      </Modal>

      {/* ADD CATEGORY MODAL */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Add New Category"
        maxWidth="sm"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <Input label="Category Name *" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} required />
          <Input label="Description" value={categoryDesc} onChange={(e) => setCategoryDesc(e.target.value)} />
          <Button type="submit" size="lg" className="w-full">
            Create Category
          </Button>
        </form>
      </Modal>
    </div>
  );
};
