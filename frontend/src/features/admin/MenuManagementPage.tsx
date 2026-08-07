import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { menuApi } from '@/services/api';
import { MenuItem, Category } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  Plus,
  Edit,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FolderPlus,
  Upload,
  Folder,
  AlertTriangle,
  Clock,
} from 'lucide-react';

export const MenuManagementPage: React.FC = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Custom Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'item' | 'category';
    id: string;
    name: string;
  } | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [isTodaysSpecial, setIsTodaysSpecial] = useState(false);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState('5');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Category Form
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');

  // UI status feedback
  const [uploadingImage, setUploadingImage] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const queryClient = useQueryClient();

  // Queries
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => menuApi.getCategories(false),
  });

  const { data: menuItems = [], isLoading: isLoadingItems, refetch: refetchMenu } = useQuery({
    queryKey: ['menu', selectedCategoryId],
    queryFn: () => menuApi.getMenuItems({ category_id: selectedCategoryId || undefined }),
  });

  // Toggle Item Availability Mutation (Instant Optimistic UI Update)
  const toggleAvailabilityMutation = useMutation({
    mutationFn: (id: string) => menuApi.toggleAvailability(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['menu'] });
      queryClient.setQueriesData({ queryKey: ['menu'] }, (oldData: any) => {
        if (!oldData) return oldData;
        if (Array.isArray(oldData)) {
          return oldData.map((item: any) =>
            item.id === id ? { ...item, is_available: !item.is_available } : item
          );
        }
        return oldData;
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      refetchMenu();
    },
  });

  // Prompt Confirmation for Item or Category Delete
  const triggerDeleteItemPrompt = (itemId: string, itemName: string) => {
    setDeleteTarget({ type: 'item', id: itemId, name: itemName });
  };

  const triggerDeleteCategoryPrompt = (catId: string, catName: string) => {
    setDeleteTarget({ type: 'category', id: catId, name: catName });
  };

  // Execute Confirmed Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setActionError(null);

    try {
      if (deleteTarget.type === 'item') {
        await menuApi.deleteMenuItem(deleteTarget.id);
        await queryClient.invalidateQueries({ queryKey: ['menu'] });
        setIsItemModalOpen(false);
        setActionSuccess(`"${deleteTarget.name}" deleted successfully!`);
      } else {
        await menuApi.deleteCategory(deleteTarget.id);
        await queryClient.invalidateQueries({ queryKey: ['categories'] });
        await queryClient.invalidateQueries({ queryKey: ['menu'] });
        if (selectedCategoryId === deleteTarget.id) {
          setSelectedCategoryId(null);
        }
        setActionSuccess(`Category "${deleteTarget.name}" deleted successfully!`);
      }

      setDeleteTarget(null);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.response?.data?.detail || 'Failed to delete target');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setActionError(null);

    try {
      const res = await menuApi.uploadImage(file);
      if (res?.image_url) {
        const envApiUrl = import.meta.env.VITE_API_BASE_URL;
        let fullUrl = res.image_url;
        if (fullUrl.startsWith('/') && envApiUrl && envApiUrl.startsWith('http')) {
          const origin = new URL(envApiUrl).origin;
          fullUrl = `${origin}${res.image_url}`;
        }
        setImageUrl(fullUrl);
        setActionSuccess('Image uploaded successfully!');
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err: any) {
      setActionError(err.response?.data?.detail || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleOpenItemModal = (item?: MenuItem, defaultCatId?: string) => {
    setActionError(null);
    if (item) {
      setEditingItem(item);
      setName(item.name);
      setDescription(item.description || '');
      setPrice(item.price.toString());
      setCategoryId(item.category_id);
      setImageUrl(item.image_url || '');
      setIsVeg(item.is_veg !== undefined ? item.is_veg : true);
      setIsTodaysSpecial(item.is_todays_special);
      setPrepTimeMinutes((item.prep_time_minutes || 5).toString());
      setSelectedDays(item.available_days || []);
      setStartTime(item.available_start_time || '');
      setEndTime(item.available_end_time || '');
    } else {
      setEditingItem(null);
      setName('');
      setDescription('');
      setPrice('');
      const targetCatId = defaultCatId || selectedCategoryId || categories[0]?.id || '';
      setCategoryId(targetCatId);
      setImageUrl('');
      setIsVeg(true);
      setIsTodaysSpecial(false);
      setPrepTimeMinutes('5');
      setSelectedDays([]);
      setStartTime('');
      setEndTime('');
    }
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    if (!name.trim()) {
      setActionError('Please enter an item name');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      setActionError('Please enter a valid price');
      return;
    }
    if (!categoryId) {
      setActionError('Please select or create a category first');
      return;
    }

    setIsSubmittingItem(true);
    try {
      const payload = {
        category_id: categoryId,
        name: name.trim(),
        description: description.trim() || undefined,
        price: parseFloat(price),
        image_url: imageUrl.trim() || undefined,
        is_veg: isVeg,
        is_todays_special: isTodaysSpecial,
        prep_time_minutes: parseInt(prepTimeMinutes) || 5,
        available_days: selectedDays,
        available_start_time: startTime || undefined,
        available_end_time: endTime || undefined,
      };

      if (editingItem) {
        await menuApi.updateMenuItem(editingItem.id, payload);
        setActionSuccess(`Item "${name.trim()}" updated successfully!`);
      } else {
        await menuApi.createMenuItem(payload);
        setActionSuccess(`Item "${name.trim()}" created successfully!`);
      }

      await queryClient.invalidateQueries({ queryKey: ['menu'] });
      setIsItemModalOpen(false);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.response?.data?.detail || 'Failed to save menu item');
    } finally {
      setIsSubmittingItem(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    if (!categoryName.trim()) {
      setActionError('Category name is required');
      return;
    }

    setIsSubmittingCat(true);
    try {
      const newCat = await menuApi.createCategory({
        name: categoryName.trim(),
        description: categoryDesc.trim(),
      });

      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      
      if (newCat?.id) {
        setCategoryId(newCat.id);
        setSelectedCategoryId(newCat.id);
      }

      setIsCategoryModalOpen(false);
      setCategoryName('');
      setCategoryDesc('');
      setActionSuccess(`Category "${newCat.name}" created successfully!`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.response?.data?.detail || 'Failed to create category');
    } finally {
      setIsSubmittingCat(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-slate-900 dark:text-slate-100">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-display">Menu & Category Manager</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Configure food items, prices, categories, prep times, and dietary types</p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => { setActionError(null); setIsCategoryModalOpen(true); }} variant="ghost" size="md" leftIcon={<FolderPlus className="w-4 h-4" />}>
            Manage Categories
          </Button>
          <Button onClick={() => handleOpenItemModal()} variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
            Add Menu Item
          </Button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-bold flex items-center gap-2 shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" /> {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm font-bold flex items-center gap-2 shadow-sm animate-fadeIn">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" /> {actionError}
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pr-4">
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategoryId === null
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            All Categories ({categories.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategoryId === cat.id
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      {isLoadingItems ? (
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
                <div className="h-28 w-full rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden relative border border-slate-200 dark:border-slate-700/50">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 font-bold font-display">
                      <ImageIcon className="w-8 h-8 stroke-[1.5] text-slate-400/60 mb-1" />
                      <span className="text-xs">{item.name.substring(0, 10)}</span>
                    </div>
                  )}

                  {/* TOP-LEFT: TODAY'S SPECIAL BADGE & FSSAI VEG SYMBOL */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 z-20">
                    <span
                      className={`w-3.5 h-3.5 rounded border bg-white dark:bg-slate-900 flex items-center justify-center shadow ${
                        item.is_veg !== false ? 'border-emerald-600' : 'border-rose-600'
                      }`}
                      title={item.is_veg !== false ? 'Pure Veg' : 'Non-Veg'}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${item.is_veg !== false ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                    </span>

                    {item.is_todays_special && (
                      <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow">
                        <Sparkles className="w-2.5 h-2.5" /> Special
                      </span>
                    )}
                  </div>

                  {/* TOP-RIGHT: INTERACTIVE STANDALONE SLIDING TOGGLE SWITCH */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAvailabilityMutation.mutate(item.id);
                    }}
                    className={`absolute top-2 right-2 p-1 rounded-full shadow-md z-30 transition-all border cursor-pointer select-none ${
                      item.is_available
                        ? 'bg-emerald-950/90 border-emerald-500 shadow-emerald-500/30'
                        : 'bg-rose-950/90 border-rose-500 shadow-rose-500/30'
                    }`}
                    title={item.is_available ? 'Available (Tap to Mark Sold Out)' : 'Sold Out (Tap to Mark Available)'}
                  >
                    <div
                      className={`w-7 h-4 rounded-full p-0.5 transition-colors flex items-center ${
                        item.is_available ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                      }`}
                    >
                      <div className="w-3 h-3 rounded-full bg-white shadow-sm transition-transform" />
                    </div>
                  </button>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{item.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{item.description || 'No description'}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-slate-400">
                    <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      <Clock className="w-2.5 h-2.5" /> {item.prep_time_minutes || 5}m prep
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-lg font-extrabold text-slate-900 dark:text-white font-display">₹{item.price}</span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleAvailabilityMutation.mutate(item.id)}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
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
                    title="Edit Item"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => triggerDeleteItemPrompt(item.id, item.name)}
                    className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white transition-colors"
                    title="Delete Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {menuItems.length === 0 && !isLoadingItems && (
            <div className="col-span-full h-48 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400">
              <p className="text-sm font-semibold">No menu items in this category yet</p>
              <button
                onClick={() => handleOpenItemModal(undefined, selectedCategoryId || undefined)}
                className="mt-2 text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline"
              >
                + Add your first menu item
              </button>
            </div>
          )}
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
          <Input label="Item Name *" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Masala Dosa" required />
          <Input label="Description (Optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Crispy crepe served with coconut chutney & sambar" />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Price (₹) *" type="number" step="0.5" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="80" required />
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500"
                required
              >
                <option value="" disabled>-- Select Category --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* FOOD TYPE (VEG / NON-VEG) SELECTOR */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-display">
              Food Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsVeg(true)}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                  isVeg
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold ring-2 ring-emerald-500/30'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="w-4 h-4 rounded-sm border-2 border-emerald-600 bg-white dark:bg-slate-900 flex items-center justify-center p-0.5 shrink-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-600" />
                </div>
                <span className="text-xs font-extrabold">Veg</span>
              </button>

              <button
                type="button"
                onClick={() => setIsVeg(false)}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                  !isVeg
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-400 font-bold ring-2 ring-rose-500/30'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="w-4 h-4 rounded-sm border-2 border-rose-600 bg-white dark:bg-slate-900 flex items-center justify-center p-0.5 shrink-0">
                  <div className="w-2 h-2 rounded-full bg-rose-600" />
                </div>
                <span className="text-xs font-extrabold">Non-Veg</span>
              </button>
            </div>
          </div>

          {/* PREP TIME & TODAY'S SPECIAL */}
          <div className="grid grid-cols-2 gap-4 items-center">
            <Input
              label="Prep Time (Mins) - Optional"
              type="number"
              min="1"
              value={prepTimeMinutes}
              onChange={(e) => setPrepTimeMinutes(e.target.value)}
              placeholder="5 (set 1 for instant Tea/Samosa)"
            />

            <div className="pt-5">
              <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <input
                  type="checkbox"
                  checked={isTodaysSpecial}
                  onChange={(e) => setIsTodaysSpecial(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded border-amber-300 focus:ring-amber-500"
                />
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-extrabold text-amber-700 dark:text-amber-300">Today's Special ✨</span>
              </label>
            </div>
          </div>

          {/* IMAGE UPLOAD & IMAGE URL SECTION */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-rose-500" /> Item Image (Optional)
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <label className="cursor-pointer shrink-0 w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                <Upload className="w-4 h-4 text-rose-500" />
                <span>{uploadingImage ? 'Uploading Image...' : 'Choose Image File'}</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={uploadingImage} />
              </label>

              <div className="w-full">
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Or paste image URL (https://...)"
                />
              </div>
            </div>

            {imageUrl && (
              <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-slate-300 dark:border-slate-700">
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Image Set</span>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate">{imageUrl}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="text-xs text-rose-500 font-bold px-2 py-1 hover:underline"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            {editingItem && (
              <button
                type="button"
                onClick={() => triggerDeleteItemPrompt(editingItem.id, editingItem.name)}
                className="px-4 py-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-sm hover:bg-rose-600 hover:text-white transition-colors flex items-center gap-2 border border-rose-500/30"
              >
                <Trash2 className="w-4 h-4" /> Delete Item
              </button>
            )}

            <Button type="submit" size="lg" className="flex-1" isLoading={isSubmittingItem}>
              {editingItem ? 'Save Changes' : 'Create Item'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MANAGE & ADD CATEGORY MODAL */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Manage Categories"
        maxWidth="md"
      >
        <div className="space-y-6">
          <form onSubmit={handleSaveCategory} className="space-y-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display flex items-center gap-1.5">
              <FolderPlus className="w-4 h-4 text-rose-500" /> Create New Category
            </h4>
            <Input label="Category Name *" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="e.g. Beverages, Snacks, Italian" required />
            <Input label="Description" value={categoryDesc} onChange={(e) => setCategoryDesc(e.target.value)} placeholder="e.g. Pizzas, Pastas & Garlic Bread" />
            <Button type="submit" size="lg" className="w-full" isLoading={isSubmittingCat}>
              Create Category
            </Button>
          </form>

          <div className="space-y-3">
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Folder className="w-4 h-4 text-amber-500" /> Existing Categories
              </span>
              <span className="text-xs font-semibold text-slate-500">{categories.length} total</span>
            </h4>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto pr-1">
              {categories.map((cat) => (
                <div key={cat.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">{cat.name}</h5>
                    {cat.description && <p className="text-xs text-slate-500 dark:text-slate-400">{cat.description}</p>}
                  </div>

                  <button
                    type="button"
                    onClick={() => triggerDeleteCategoryPrompt(cat.id, cat.name)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white transition-colors text-xs font-bold flex items-center gap-1 border border-rose-500/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* IN-APP CUSTOM DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Deletion"
        maxWidth="sm"
      >
        <div className="space-y-4 text-center py-2">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-display">
              Delete {deleteTarget?.type === 'item' ? 'Menu Item' : 'Category'}?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-slate-100">"{deleteTarget?.name}"</span>?
              {deleteTarget?.type === 'category' && ' All menu items in this category will also be removed.'}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              className="flex-1"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              isLoading={isDeleting}
              className="flex-1"
            >
              Delete Now
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
