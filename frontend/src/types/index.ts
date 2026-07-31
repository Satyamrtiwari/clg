export type UserRole = 'ADMIN' | 'CASHIER';

export interface Role {
  id: string;
  name: UserRole;
  description?: string;
  permissions: Record<string, boolean>;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  full_name?: string;
  is_active: boolean;
  role: Role;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  is_todays_special: boolean;
  prep_time_minutes: number;
  available_days?: string[];
  available_start_time?: string;
  available_end_time?: string;
  category?: Category;
}

export type OrderStatus = 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'WALLET';

export interface OrderItem {
  id: string;
  menu_item_id: string;
  item_name: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  notes?: string;
}

export interface Order {
  id: string;
  daily_order_number: string;
  order_date: string;
  customer_name: string;
  status: OrderStatus;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  cashier_id?: string;
  completed_at?: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface SystemConfig {
  canteen_name: string;
  canteen_tagline: string;
  currency_symbol: string;
  tax_rate_percent: number;
  auto_remove_minutes: number;
  cashier_can_edit_menu: boolean;
  qr_display_interval_seconds: number;
}

export interface AnalyticsDashboard {
  today_revenue: number;
  today_orders_count: number;
  completed_orders_count: number;
  cancelled_orders_count: number;
  active_queue_count: number;
  average_order_value: number;
  top_items: Array<{
    item_name: string;
    total_quantity: number;
    total_revenue: number;
  }>;
}
