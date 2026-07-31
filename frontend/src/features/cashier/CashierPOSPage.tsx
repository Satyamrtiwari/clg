import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { menuApi, ordersApi } from '@/services/api';
import { useCartStore } from '@/store/useCartStore';
import { PaymentMethod } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { QRCodeSVG } from 'qrcode.react';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  CreditCard,
  QrCode,
  Banknote,
  UtensilsCrossed,
  Sparkles,
  User,
} from 'lucide-react';

export const CashierPOSPage: React.FC = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [lastCreatedOrderNum, setLastCreatedOrderNum] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const {
    customerName,
    setCustomerName,
    items: cartItems,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    paymentMethod,
    setPaymentMethod,
    discountAmount,
    setDiscountAmount,
    getSubtotal,
    getTaxAmount,
    getTotalAmount,
  } = useCartStore();

  // Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => menuApi.getCategories(true),
  });

  // Fetch Menu Items
  const { data: menuItems = [], isLoading: isMenuLoading } = useQuery({
    queryKey: ['menu', selectedCategoryId, searchQuery],
    queryFn: () =>
      menuApi.getMenuItems({
        category_id: selectedCategoryId || undefined,
        search: searchQuery || undefined,
      }),
  });

  const handleCheckoutSubmit = async () => {
    if (!customerName.trim()) {
      setErrorMsg('Please enter customer name');
      return;
    }
    if (cartItems.length === 0) {
      setErrorMsg('Cart is empty');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const orderPayload = {
        customer_name: customerName.trim(),
        items: cartItems.map((ci) => ({
          menu_item_id: ci.menuItem.id,
          quantity: ci.quantity,
          notes: ci.notes,
        })),
        payment_method: paymentMethod,
        discount_amount: discountAmount,
      };

      const createdOrder = await ordersApi.createOrder(orderPayload);
      setLastCreatedOrderNum(createdOrder.daily_order_number);
      setIsPaymentModalOpen(false);
      setIsSuccessModalOpen(true);
      clearCart();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = getTotalAmount();

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* LEFT SECTION: Categories & Product Grid */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200 dark:border-slate-800/80">
        {/* Search Bar & Filters */}
        <div className="p-4 bg-white dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search menu item (e.g. Masala Chai, Dosa)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategoryId(null)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategoryId === null
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategoryId === cat.id
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                    : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {isMenuLoading ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
              Loading Menu Items...
            </div>
          ) : menuItems.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-2">
              <UtensilsCrossed className="w-12 h-12 stroke-[1.5]" />
              <p className="text-sm font-medium">No menu items found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {menuItems.map((item) => {
                const inCart = cartItems.find((ci) => ci.menuItem.id === item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => item.is_available && addItem(item)}
                    className={`relative flex flex-col justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                      !item.is_available
                        ? 'opacity-40 bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/50 cursor-not-allowed'
                        : inCart
                        ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-500/50 ring-1 ring-rose-500/50 shadow-md'
                        : 'bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800/90 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="h-20 w-full rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden mb-2 relative">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600 font-display font-bold text-xl">
                            {item.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        {item.is_todays_special && (
                          <span className="absolute top-2 right-2 bg-amber-500 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow z-10">
                            <Sparkles className="w-3 h-3" /> Special
                          </span>
                        )}
                        {!item.is_available && (
                          <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center text-red-400 font-bold text-xs z-10">
                            UNAVAILABLE
                          </div>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">{item.name}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{item.description || 'Freshly prepared'}</p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                      <span className="text-base font-extrabold text-slate-900 dark:text-white font-display">₹{item.price}</span>
                      {inCart ? (
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-600 text-white text-xs font-bold shadow">
                          {inCart.quantity}
                        </span>
                      ) : (
                        <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700">
                          <Plus className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SECTION: Cart & POS Checkout */}
      <div className="w-full md:w-96 flex flex-col bg-white dark:bg-slate-900/90 shadow-xl border-l border-slate-200 dark:border-slate-800/80">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-rose-600 dark:text-rose-500" />
            <h2 className="font-extrabold text-base text-slate-900 dark:text-white font-display">Current Order</h2>
          </div>
          {cartItems.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors font-medium"
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* Customer Name Input */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-800/80 space-y-2">
          <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-display">
            Customer Name <span className="text-rose-500">*</span>
          </label>
          <Input
            placeholder="Enter customer name..."
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            leftIcon={<User className="w-4 h-4 text-slate-400" />}
          />
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-2 py-12">
              <ShoppingCart className="w-12 h-12 stroke-[1.5]" />
              <p className="text-sm font-medium">Cart is empty</p>
              <p className="text-xs text-slate-400 text-center">Tap any menu item on the left to add to order</p>
            </div>
          ) : (
            cartItems.map((ci) => (
              <div
                key={ci.menuItem.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">{ci.menuItem.name}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">₹{ci.menuItem.price} each</p>
                  </div>
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white font-display">
                    ₹{ci.menuItem.price * ci.quantity}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuantity(ci.menuItem.id, -1);
                      }}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300"
                      title="Decrease Quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-slate-900 dark:text-white">{ci.quantity}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuantity(ci.menuItem.id, 1);
                      }}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300"
                      title="Increase Quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(ci.menuItem.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Remove Item from Cart"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Summary & Checkout */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 space-y-3">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Subtotal</span>
              <span className="font-semibold">₹{getSubtotal()}</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>GST / Tax (5%)</span>
              <span className="font-semibold">₹{getTaxAmount()}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
              <span>Discount (₹)</span>
              <input
                type="number"
                min="0"
                value={discountAmount || ''}
                onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                className="w-16 px-2 py-0.5 text-right text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-bold"
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="font-extrabold text-sm text-slate-900 dark:text-white font-display">Total Payable</span>
            <span className="font-black text-xl text-rose-600 dark:text-rose-400 font-display">₹{totalAmount}</span>
          </div>

          {errorMsg && <p className="text-xs text-red-500 font-semibold">{errorMsg}</p>}

          <Button
            onClick={() => {
              if (!customerName.trim()) {
                setErrorMsg('Please enter customer name');
                return;
              }
              if (cartItems.length === 0) {
                setErrorMsg('Cart is empty');
                return;
              }
              setErrorMsg('');
              setIsPaymentModalOpen(true);
            }}
            disabled={cartItems.length === 0}
            variant="primary"
            className="w-full py-3"
            size="lg"
          >
            Checkout & Pay (₹{totalAmount})
          </Button>
        </div>
      </div>

      {/* Payment Selection Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Complete Checkout & Payment"
      >
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Total Amount</span>
              <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 font-display">₹{totalAmount}</h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Customer</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{customerName}</p>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Select Payment Method</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'CASH', label: 'Cash', icon: Banknote },
                { id: 'UPI', label: 'UPI QR', icon: QrCode },
                { id: 'CARD', label: 'Card', icon: CreditCard },
              ].map((pm) => {
                const IconComp = pm.icon;
                const isSel = paymentMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id as PaymentMethod)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                      isSel
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-600 dark:text-rose-400 font-bold ring-2 ring-rose-500/50'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <IconComp className="w-5 h-5" />
                    <span className="text-xs">{pm.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* UPI Dynamic QR View */}
          {paymentMethod === 'UPI' && (
            <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
              <p className="text-xs text-slate-600 font-bold">Scan to Pay ₹{totalAmount}</p>
              <div className="flex justify-center p-2">
                <QRCodeSVG value={`upi://pay?pa=canteen@upi&pn=SmartCanteen&am=${totalAmount}&cu=INR`} size={140} />
              </div>
              <p className="text-[10px] text-slate-400 font-mono">canteen@upi</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCheckoutSubmit}
              isLoading={isSubmitting}
              variant="success"
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Confirm & Print Order
            </Button>
          </div>
        </div>
      </Modal>

      {/* Order Created Success Modal */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="Order Placed Successfully!"
      >
        <div className="text-center space-y-4 py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Daily Order Number</span>
            <h2 className="text-5xl font-black text-rose-600 dark:text-rose-500 font-display">#{lastCreatedOrderNum}</h2>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Order sent to kitchen & live display system. Give token receipt to customer.
          </p>

          <Button onClick={() => setIsSuccessModalOpen(false)} variant="primary" className="w-full">
            Done (Next Order)
          </Button>
        </div>
      </Modal>
    </div>
  );
};
