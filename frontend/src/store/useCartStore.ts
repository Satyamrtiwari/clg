import { create } from 'zustand';
import { MenuItem, PaymentMethod } from '@/types';

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

interface CartState {
  customerName: string;
  items: CartItem[];
  paymentMethod: PaymentMethod;
  discountAmount: number;
  
  setCustomerName: (name: string) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setDiscountAmount: (amount: number) => void;
  
  addItem: (item: MenuItem, notes?: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  setItemQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  
  getSubtotal: () => number;
  getTaxAmount: () => number;
  getTotalAmount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  customerName: '',
  items: [],
  paymentMethod: 'CASH',
  discountAmount: 0,

  setCustomerName: (name: string) => set({ customerName: name }),
  setPaymentMethod: (method: PaymentMethod) => set({ paymentMethod: method }),
  setDiscountAmount: (amount: number) => set({ discountAmount: Math.max(0, amount) }),

  addItem: (menuItem: MenuItem, notes?: string) => {
    if (!menuItem.is_available) return;
    const currentItems = get().items;
    const existingIndex = currentItems.findIndex((ci) => ci.menuItem.id === menuItem.id);

    if (existingIndex > -1) {
      const updated = [...currentItems];
      updated[existingIndex].quantity += 1;
      set({ items: updated });
    } else {
      set({ items: [...currentItems, { menuItem, quantity: 1, notes }] });
    }
  },

  removeItem: (itemId: string) => {
    set({ items: get().items.filter((ci) => ci.menuItem.id !== itemId) });
  },

  updateQuantity: (itemId: string, delta: number) => {
    const currentItems = get().items;
    const updated = currentItems
      .map((ci) => {
        if (ci.menuItem.id === itemId) {
          const newQty = ci.quantity + delta;
          return newQty > 0 ? { ...ci, quantity: newQty } : null;
        }
        return ci;
      })
      .filter(Boolean) as CartItem[];

    set({ items: updated });
  },

  setItemQuantity: (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(itemId);
      return;
    }
    const currentItems = get().items;
    const updated = currentItems.map((ci) => (ci.menuItem.id === itemId ? { ...ci, quantity } : ci));
    set({ items: updated });
  },

  clearCart: () => {
    set({
      customerName: '',
      items: [],
      paymentMethod: 'CASH',
      discountAmount: 0,
    });
  },

  getSubtotal: () => {
    return get().items.reduce((sum, ci) => sum + ci.menuItem.price * ci.quantity, 0);
  },

  getTaxAmount: () => {
    const subtotal = get().getSubtotal();
    return Math.round(subtotal * 0.05 * 100) / 100;
  },

  getTotalAmount: () => {
    const subtotal = get().getSubtotal();
    const tax = get().getTaxAmount();
    const discount = get().discountAmount;
    return Math.max(0, Math.round((subtotal + tax - discount) * 100) / 100);
  },
}));
