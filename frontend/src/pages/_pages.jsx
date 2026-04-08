// ── OrdersPage ────────────────────────────────────────────────
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Package, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../lib/api';

const STATUS_COLOR = {
  pending:          'bg-gray-100 text-gray-600',
  awaiting_payment: 'bg-yellow-100 text-yellow-700',
  paid:             'bg-blue-100 text-blue-700',
  processing:       'bg-blue-100 text-blue-700',
  shipped:          'bg-teal/20 text-teal',
  delivered:        'bg-green-100 text-green-700',
  cancelled:        'bg-red-100 text-red-500',
  refunded:         'bg-orange-100 text-orange-600',
};

export function OrdersPage() {
  const [expanded, setExpanded] = useState(null);
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn:  () => api.get('/orders').then(r => r.data),
  });

  if (isLoading) return <div className="pt-32 text-center text-gray-400">Loading orders…</div>;

  return (
    <div className="pt-20 min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="section-title mb-8">My Orders</h1>
        {!data?.orders?.length ? (
          <div className="text-center py-16">
            <Package size={40} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-400">No orders yet. Start shopping!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.orders.map((order, i) => (
              <motion.div key={order.id} initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.05 }}
                className="bg-white rounded-2xl shadow-sm overflow-hidden"
              >
                <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(e => e === order.id ? null : order.id)}>
                  <div>
                    <p className="font-mono text-xs text-gray-400">{order.midtrans_order_id || order.id.slice(0,12)}</p>
                    <p className="font-semibold text-sm mt-1">{new Date(order.created_at).toLocaleDateString('id-ID', { year:'numeric', month:'long', day:'numeric' })}</p>
                    <p className="font-bold text-coral mt-0.5">Rp {Number(order.total).toLocaleString('id-ID')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLOR[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                    {expanded === order.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>
                {expanded === order.id && (
                  <div className="border-t border-gray-100 p-5 space-y-3">
                    {(order.items || []).map((item, j) => (
                      <div key={j} className="flex items-center gap-3">
                        {item.product_image && (
                          <img src={item.product_image} alt="" className="w-12 h-12 rounded-xl object-cover bg-cream-dark" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.product_name}</p>
                          <p className="text-xs text-gray-400">x{item.quantity}</p>
                        </div>
                        <p className="text-sm font-bold">Rp {Number(item.unit_price * item.quantity).toLocaleString('id-ID')}</p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── AboutPage ────────────────────────────────────────────────
export function AboutPage() {
  return (
    <div className="pt-20 min-h-screen page-enter">
      {/* Hero */}
      <section className="relative bg-ink py-32 text-center overflow-hidden">
        <div className="blob" style={{ background:'#FF6B6B', width:500, height:500, top:'-20%', left:'30%', opacity:0.12 }} />
        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <p className="text-coral text-sm font-semibold uppercase tracking-widest mb-4">Our Story</p>
          <h1 className="font-display font-bold text-5xl md:text-6xl text-white mb-6 leading-tight">
            Shopping,<br /><span className="gradient-text">reimagined</span>
          </h1>
          <p className="text-white/60 text-lg leading-relaxed">
            ShopAI was built with a single mission: make shopping effortless and intelligent.
            We combine the power of large language models with real-time personalization
            to help every shopper find exactly what they need. Brought to you by Yuwanandra, a solo founder and currently a student at Dian Nuswantoro University, a man passionate about AI and e-commerce.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { emoji: '🤖', title: 'AI-First', desc: 'Every product recommendation is powered by a custom AI model that learns from your behavior to surface exactly what you need.' },
            { emoji: '🔒', title: 'Privacy-Safe', desc: 'Your data is encrypted and never sold. We use behavioral signals only to improve your shopping experience — nothing else.' },
            { emoji: '🇮🇩', title: 'Made in Indonesia', desc: 'ShopAI is proudly built in Indonesia with Rupiah-native pricing, local payment methods, and Indonesian language support.' },
          ].map((v, i) => (
            <motion.div key={i} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay: i*0.15 }}
              className="bg-white rounded-3xl p-8 shadow-sm text-center"
            >
              <div className="text-5xl mb-5">{v.emoji}</div>
              <h3 className="font-display font-bold text-xl mb-3">{v.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="py-16 px-6 max-w-4xl mx-auto" id="contact">
        <h2 className="section-title text-center mb-12">Get in Touch</h2>
        <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
          <p className="text-gray-500 mb-6">Have questions, feedback, or partnership inquiries? We'd love to hear from you.</p>
          <a href="mailto:yuwanandrarisdyaksa7677@gmail.com" className="btn-primary text-base px-8 py-3.5 inline-flex">
            📧 hello@shopai.id
          </a>
        </div>
      </section>
    </div>
  );
}

// ── LoginPage ────────────────────────────────────────────────
import { Link as RLink, useNavigate as useNav } from 'react-router-dom';
import { useAuthStore as useAuth } from '../store';
import toast from 'react-hot-toast';

export function LoginPage() {
  const nav = useNav();
  const { setAuth } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      setAuth(data.user, data.token);
      toast.success(`Welcome back, ${data.user.full_name || data.user.username}! 👋`);
      nav('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4 py-20">
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="bg-white rounded-3xl p-8 sm:p-10 w-full max-w-md shadow-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-coral mb-4 shadow-lg shadow-coral/30">
            <span className="text-white text-xl">✦</span>
          </div>
          <h1 className="font-display font-bold text-2xl">Welcome back</h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to your ShopAI account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Email</label>
            <input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}
              className="input-field" placeholder="you@example.com" required />
          </div>
          <div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Password</label>
            <input type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}
              className="input-field" placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5 text-base rounded-2xl shadow-lg shadow-coral/25 mt-2">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-6">
          Don't have an account? <RLink to="/register" className="text-coral font-medium hover:underline">Sign up</RLink>
        </p>
      </motion.div>
    </div>
  );
}

// ── RegisterPage ─────────────────────────────────────────────
export function RegisterPage() {
  const nav = useNav();
  const { setAuth } = useAuth();
  const [form, setForm] = useState({ email:'', username:'', password:'', full_name:'' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      setAuth(data.user, data.token);
      toast.success('Account created! Welcome to ShopAI 🎉');
      nav('/');
    } catch (err) {
      const errs = err.response?.data?.errors;
      toast.error(errs?.[0]?.msg || err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4 py-20">
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="bg-white rounded-3xl p-8 sm:p-10 w-full max-w-md shadow-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-coral mb-4 shadow-lg shadow-coral/30">
            <span className="text-white text-xl">✦</span>
          </div>
          <h1 className="font-display font-bold text-2xl">Create Account</h1>
          <p className="text-gray-400 text-sm mt-1">Join ShopAI today</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: 'full_name', label: 'Full Name',  type: 'text',     ph: 'Your name' },
            { key: 'username',  label: 'Username',   type: 'text',     ph: 'Choose a username' },
            { key: 'email',     label: 'Email',      type: 'email',    ph: 'you@example.com' },
            { key: 'password',  label: 'Password',   type: 'password', ph: 'Min 8 chars, 1 uppercase, 1 number' },
          ].map(({ key, label, type, ph }) => (
            <div key={key}>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">{label}</label>
              <input type={type} value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}
                className="input-field" placeholder={ph} required />
            </div>
          ))}
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5 text-base rounded-2xl shadow-lg shadow-coral/25 mt-2">
            {loading ? 'Creating…' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account? <RLink to="/login" className="text-coral font-medium hover:underline">Sign in</RLink>
        </p>
      </motion.div>
    </div>
  );
}

export default OrdersPage;
