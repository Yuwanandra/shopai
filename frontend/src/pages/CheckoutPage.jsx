import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, CreditCard, CheckCircle } from 'lucide-react';
import { useCartStore, useAuthStore } from '../store';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user }  = useAuthStore();
  const { items, clearCart } = useCartStore();
  const couponCode = location.state?.coupon_code;

  const [form, setForm] = useState({
    full_name:    user?.full_name || '',
    phone:        user?.phone     || '',
    address:      user?.address   || '',
    city:         '',
    postal_code:  '',
    notes:        '',
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.address || !form.city) { toast.error('Please fill shipping address'); return; }
    if (items.length === 0) { toast.error('Cart is empty'); return; }

    setLoading(true);
    try {
      const orderItems = items.map(i => ({
        product_id: i.product_id,
        quantity:   i.quantity,
      }));

      const { data } = await api.post('/orders', {
        items: orderItems,
        shipping_address: form,
        coupon_code: couponCode,
        notes: form.notes,
      });

      // Open Midtrans Snap
      if (data.snap_token) {
        window.snap.pay(data.snap_token, {
          onSuccess: (result) => {
            clearCart();
            toast.success('Payment successful! 🎉');
            navigate('/orders');
          },
          onPending: (result) => {
            clearCart();
            toast('Payment pending. Check your orders.', { icon: '⏳' });
            navigate('/orders');
          },
          onError: (result) => {
            toast.error('Payment failed. Please try again.');
          },
          onClose: () => {
            toast('Payment window closed. Your order is saved.', { icon: 'ℹ️' });
            navigate('/orders');
          },
        });
      } else {
        clearCart();
        toast.success('Order placed!');
        navigate('/orders');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <div className="pt-20 min-h-screen bg-cream">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="section-title mb-10">Checkout</h1>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Shipping */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <h2 className="font-semibold text-base flex items-center gap-2 mb-5">
                  <MapPin size={18} className="text-coral" /> Shipping Address
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'full_name', label: 'Full Name', col: 2 },
                    { key: 'phone',     label: 'Phone Number' },
                    { key: 'city',      label: 'City' },
                    { key: 'address',   label: 'Street Address', col: 2 },
                    { key: 'postal_code', label: 'Postal Code' },
                  ].map(({ key, label, col }) => (
                    <div key={key} className={col === 2 ? 'sm:col-span-2' : ''}>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">{label}</label>
                      <input
                        value={form[key]}
                        onChange={e => set(key, e.target.value)}
                        className="input-field"
                        placeholder={label}
                        required={['full_name','address','city'].includes(key)}
                      />
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Order Notes (optional)</label>
                    <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                      className="input-field resize-none" rows={3} placeholder="Any special instructions…" />
                  </div>
                </div>
              </div>

              {/* Payment info */}
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <h2 className="font-semibold text-base flex items-center gap-2 mb-3">
                  <CreditCard size={18} className="text-coral" /> Payment
                </h2>
                <p className="text-sm text-gray-400">
                  You'll be redirected to <strong>Midtrans</strong> secure payment gateway to complete your purchase.
                  Supports transfer bank, GoPay, OVO, credit cards, and more.
                </p>
                <div className="mt-4 flex gap-3 flex-wrap">
                  {['BCA', 'BNI', 'Mandiri', 'GoPay', 'OVO', 'QRIS'].map(m => (
                    <span key={m} className="chip text-xs px-3 py-1.5">{m}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Order summary */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl p-6 shadow-sm sticky top-24">
                <h3 className="font-semibold mb-5">Order Summary</h3>
                <div className="space-y-3 mb-5 max-h-64 overflow-y-auto pr-1">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-3">
                      <img src={item.image_url} alt="" className="w-12 h-12 rounded-xl object-cover bg-cream-dark shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium line-clamp-2 text-ink">{item.name}</p>
                        <p className="text-xs text-gray-400">x{item.quantity}</p>
                      </div>
                      <p className="text-xs font-bold shrink-0">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>Rp {subtotal.toLocaleString('id-ID')}</span></div>
                  <div className="flex justify-between text-gray-400"><span>Shipping</span><span>Rp 15.000</span></div>
                  <div className="flex justify-between text-gray-400"><span>Tax (11%)</span><span>Rp {Math.round(subtotal*0.11).toLocaleString('id-ID')}</span></div>
                  <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
                    <span>Total</span>
                    <span>Rp {(subtotal + 15000 + Math.round(subtotal*0.11)).toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-6 py-3.5 rounded-2xl text-base shadow-xl shadow-coral/25 disabled:opacity-60">
                  {loading ? (
                    <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing…</span>
                  ) : (
                    <><CheckCircle size={18} /> Place Order & Pay</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
