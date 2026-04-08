// ============================================================
// CartPage.jsx
// ============================================================
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { useCartStore, useAuthStore } from '../store';
import { useCurrencyStore } from '../store/currency';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useState } from 'react';

export function CartPage() {
  const { items, removeItem, updateQty, clearCart, total, itemCount } = useCartStore();
  const { user } = useAuthStore();
  const navigate  = useNavigate();
  const { format } = useCurrencyStore();
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(null);
  const [checking, setChecking] = useState(false);

  const subtotal  = total();
  const shipping  = subtotal > 0 ? 15000 : 0;
  const tax       = Math.round(subtotal * 0.11);
  const discAmt   = discount?.discount || 0;
  const grandTotal = subtotal + shipping + tax - discAmt;

  const handleRemove = async (item) => {
    removeItem(item.id);
    if (user && !item.id.startsWith('local_')) {
      await api.delete(`/cart/${item.id}`).catch(() => {});
    }
    toast.success('Removed from cart');
  };

  const handleQty = async (item, qty) => {
    if (qty < 1) return;
    updateQty(item.id, qty);
    if (user && !item.id.startsWith('local_')) {
      await api.patch(`/cart/${item.id}`, { quantity: qty }).catch(() => {});
    }
  };

  const validateCoupon = async () => {
    if (!user) { toast.error('Log in to use coupons'); return; }
    if (!coupon) return;
    setChecking(true);
    try {
      const { data } = await api.post('/coupons/validate', { code: coupon, subtotal });
      setDiscount(data);
      toast.success(`Coupon applied! -Rp ${data.discount.toLocaleString('id-ID')}`);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Invalid coupon');
    } finally {
      setChecking(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="pt-28 min-h-screen flex flex-col items-center justify-center text-center px-6">
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
          <div className="text-7xl mb-6">🛒</div>
          <h2 className="font-display font-bold text-3xl mb-3">Your cart is empty</h2>
          <p className="text-gray-400 mb-8">Add some products and come back!</p>
          <Link to="/shop" className="btn-primary text-base px-8 py-3.5">
            Browse Products <ArrowRight size={18} />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="section-title mb-8">Your Cart ({itemCount()} items)</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  exit={{ opacity: 0, x: -50, height: 0 }}
                  className="bg-white rounded-2xl p-5 flex gap-4 shadow-sm"
                >
                  <Link to={`/product/${item.slug}`}>
                    <img
                      src={item.image_url || 'https://placehold.co/80x80/FFF8F0/FF6B6B'}
                      alt={item.name}
                      className="w-20 h-20 rounded-xl object-cover bg-cream-dark shrink-0"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${item.slug}`}>
                      <p className="font-semibold text-sm hover:text-coral transition-colors line-clamp-2">{item.name}</p>
                    </Link>
                    <p className="font-bold text-base mt-1">{format(item.price)}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3 bg-cream-dark rounded-xl px-3 py-1.5">
                        <button onClick={() => handleQty(item, item.quantity - 1)} disabled={item.quantity <= 1} className="text-gray-400 hover:text-coral disabled:opacity-30">
                          <Minus size={14} />
                        </button>
                        <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                        <button onClick={() => handleQty(item, item.quantity + 1)} disabled={item.quantity >= item.stock} className="text-gray-400 hover:text-coral disabled:opacity-30">
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-coral">{format(item.price * item.quantity)}</p>
                        <button onClick={() => handleRemove(item)} className="text-gray-300 hover:text-red-400 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 shadow-sm sticky top-24">
              <h3 className="font-display font-bold text-lg mb-6">Order Summary</h3>

              {/* Coupon */}
              <div className="flex gap-2 mb-6">
                <div className="relative flex-1">
                  <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={coupon}
                    onChange={e => setCoupon(e.target.value.toUpperCase())}
                    placeholder="Coupon code"
                    className="input-field pl-9 text-sm h-10"
                  />
                </div>
                <button onClick={validateCoupon} disabled={checking} className="btn-outline text-sm px-4 h-10">
                  {checking ? '…' : 'Apply'}
                </button>
              </div>

              {/* Line items */}
              <div className="space-y-3 text-sm mb-6">
                {[
                  { label: 'Subtotal',  val: subtotal },
                  { label: 'Shipping',  val: shipping },
                  { label: 'Tax (11%)', val: tax },
                  ...(discAmt > 0 ? [{ label: `Discount (${coupon})`, val: -discAmt, red: true }] : []),
                ].map(({ label, val, red }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-400">{label}</span>
                    <span className={`font-medium ${red ? 'text-coral' : 'text-ink'}`}>
                      {red ? '-' : ''}{format(Math.abs(val))}
                    </span>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>{format(grandTotal)}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!user) { toast.error('Please log in to checkout'); return; }
                  navigate('/checkout', { state: { coupon_code: discount ? coupon : null } });
                }}
                className="btn-primary w-full justify-center text-base py-3.5 rounded-2xl shadow-xl shadow-coral/25"
              >
                Proceed to Checkout <ArrowRight size={18} />
              </button>

              <div className="mt-4 text-center">
                <Link to="/shop" className="text-sm text-gray-400 hover:text-coral transition-colors">
                  ← Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;