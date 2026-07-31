import api from '@/lib/axios';
import { User, Category, MenuItem, Order, SystemConfig, AnalyticsDashboard } from '@/types';

export const authApi = {
  login: async (credentials: { username: string; password: string }) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

export const menuApi = {
  getCategories: async (activeOnly = false): Promise<Category[]> => {
    const res = await api.get(`/categories?active_only=${activeOnly}`);
    return res.data;
  },
  createCategory: async (data: Partial<Category>): Promise<Category> => {
    const res = await api.post('/categories', data);
    return res.data;
  },
  updateCategory: async (id: string, data: Partial<Category>): Promise<Category> => {
    const res = await api.put(`/categories/${id}`, data);
    return res.data;
  },
  getMenuItems: async (params?: { category_id?: string; search?: string; available_only?: boolean; todays_special_only?: boolean }): Promise<MenuItem[]> => {
    const res = await api.get('/menu', { params });
    return res.data;
  },
  createMenuItem: async (data: Partial<MenuItem>): Promise<MenuItem> => {
    const res = await api.post('/menu', data);
    return res.data;
  },
  updateMenuItem: async (id: string, data: Partial<MenuItem>): Promise<MenuItem> => {
    const res = await api.put(`/menu/${id}`, data);
    return res.data;
  },
  toggleAvailability: async (id: string): Promise<MenuItem> => {
    const res = await api.patch(`/menu/${id}/toggle-availability`);
    return res.data;
  },
  deleteMenuItem: async (id: string): Promise<void> => {
    await api.delete(`/menu/${id}`);
  },
  uploadImage: async (file: File): Promise<{ image_url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

export const ordersApi = {
  createOrder: async (data: {
    customer_name: string;
    items: Array<{ menu_item_id: string; quantity: number; notes?: string }>;
    payment_method: string;
    discount_amount?: number;
  }): Promise<Order> => {
    const res = await api.post('/orders', data);
    return res.data;
  },
  getOrderQueue: async (params?: any): Promise<Order[]> => {
    const res = await api.get('/orders/queue', { params });
    return res.data;
  },
  getOrders: async (params?: any): Promise<Order[]> => {
    const res = await api.get('/orders/queue', { params });
    return res.data;
  },
  getDisplayOrders: async (): Promise<Order[]> => {
    const res = await api.get('/orders/display');
    return res.data;
  },
  updateOrderStatus: async (id: string, status: string): Promise<Order> => {
    const res = await api.patch(`/orders/${id}/status`, { status });
    return res.data;
  },
  updateStatus: async (id: string, status: string): Promise<Order> => {
    const res = await api.patch(`/orders/${id}/status`, { status });
    return res.data;
  },
};

export const settingsApi = {
  getAll: async () => {
    const res = await api.get('/settings');
    return res.data;
  },
  getConfig: async (): Promise<SystemConfig> => {
    const res = await api.get('/settings/config');
    return res.data;
  },
  updateSetting: async (key: string, value: any) => {
    const res = await api.put(`/settings/${key}`, value);
    return res.data;
  },
};

export const analyticsApi = {
  getDashboard: async (): Promise<AnalyticsDashboard> => {
    const res = await api.get('/analytics/dashboard');
    return res.data;
  },
};
