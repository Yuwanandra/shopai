import { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Sparkles, TrendingUp, Zap, Shield, Truck } from 'lucide-react';
import api from '../lib/api';
import ProductCard from '../components/products/ProductCard';
import { useUIStore } from '../store';

/* ── Floating Orb ───────────────────────────────────────────── */
function Orb({ color, size, top, left, delay = 0 }) {
  return (
    <motion.div
      className="blob"
      style={{ width: size, height: size, top, left, background: color }}
      animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
      transition={{ duration: 8 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    />
  );
}

/* ── Category Pill ──────────────────────────────────────────── */
function CategoryPill({ cat, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index }}
    >
      <Link
        to={`/shop/${cat.slug}`}
        className="flex flex-col items-center gap-2 group"
      >
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white shadow-md flex items-center justify-center text-3xl md:text-4xl group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-coral/10 transition-all duration-300">
          {cat.icon}
        </div>
        <span className="text-xs font-medium text-ink group-hover:text-coral transition-colors text-center leading-tight">
          {cat.name}
        </span>
      </Link>
    </motion.div>
  );
}

/* ── Stat card ──────────────────────────────────────────────── */
function StatCard({ value, label, icon: Icon, color }) {
  return (
    <div className="flex items-center gap-4 bg-white rounded-2xl px-5 py-4 shadow-sm">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + '20' }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <p className="font-display font-bold text-xl text-ink">{value}</p>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate  = useNavigate();
  const { toggleChat } = useUIStore();
  const heroRef   = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY     = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn:  () => api.get('/categories').then(r => r.data),
  });

  const { data: featuredData } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn:  () => api.get('/products?featured=true&limit=8').then(r => r.data),
  });

  const { data: trendingData } = useQuery({
    queryKey: ['products', 'trending'],
    queryFn:  () => api.get('/products?sort=popular&limit=8').then(r => r.data),
  });

  const { data: recData } = useQuery({
    queryKey: ['recommendations'],
    queryFn:  () => api.get('/recommendations?limit=8').then(r => r.data),
  });

  return (
    <div className="page-enter">
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden pt-16">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFF8F0] via-[#FFF3E8] to-[#FFE8D5]" />

        {/* Floating orbs */}
        <Orb color="#FF6B6B" size={500} top="-10%" left="-5%"  delay={0} />
        <Orb color="#FFB347" size={400} top="20%"  left="60%"  delay={2} />
        <Orb color="#4ECDC4" size={300} top="60%"  left="10%"  delay={4} />

        {/* Animated grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(#0D0D0D 1px, transparent 1px), linear-gradient(90deg, #0D0D0D 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Floating product circles */}
        {[
          { img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop', top:'15%', right:'8%', size:120, delay:0 },
          { img: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=200&h=200&fit=crop', top:'55%', right:'18%', size:90,  delay:1.5 },
          { img: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=200&h=200&fit=crop', top:'70%', right:'5%',  size:110, delay:0.8 },
          { img: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200&h=200&fit=crop', top:'25%', right:'28%', size:75,  delay:2.2 },
        ].map((item, i) => (
          <motion.div
            key={i}
            className="absolute hidden lg:block rounded-full overflow-hidden shadow-2xl border-4 border-white/60"
            style={{ top: item.top, right: item.right, width: item.size, height: item.size }}
            animate={{ y: [0, -15, 0], rotate: [0, 3, 0] }}
            transition={{ duration: 6 + i, repeat: Infinity, ease: 'easeInOut', delay: item.delay }}
          >
            <img src={item.img} alt="" className="w-full h-full object-cover" />
          </motion.div>
        ))}

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-7xl mx-auto px-6 py-20"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-coral/20 mb-8"
          >
            <Sparkles size={14} className="text-coral" />
            <span className="text-xs font-semibold text-coral tracking-wide">AI-Powered Shopping Assistant</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7, ease: [0.34, 1.2, 0.64, 1] }}
            className="font-display font-bold leading-none mb-6"
            style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}
          >
            Shop Smarter<br />
            <span className="gradient-text">with AI</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-lg text-gray-500 max-w-xl mb-10 leading-relaxed"
          >
            Discover products curated just for you. Our AI learns your taste, compares prices,
            and finds the best deals — all in real time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="flex flex-wrap gap-3"
          >
            <button
              onClick={() => navigate('/shop')}
              className="btn-primary text-base px-8 py-3.5 rounded-2xl shadow-xl shadow-coral/30"
            >
              Browse Products <ArrowRight size={18} />
            </button>
            <button
              onClick={toggleChat}
              className="btn-outline text-base px-8 py-3.5 rounded-2xl flex items-center gap-2"
            >
              <Sparkles size={18} className="text-coral" />
              Ask ShopBot
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-14 max-w-2xl"
          >
            <StatCard value="10K+" label="Products" icon={Zap} color="#FF6B6B" />
            <StatCard value="50K+" label="Happy Customers" icon={TrendingUp} color="#4ECDC4" />
            <StatCard value="99.9%" label="Uptime" icon={Shield} color="#FFB347" />
            <StatCard value="Free" label="Shipping 500K+" icon={Truck} color="#FF6B6B" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── CATEGORIES ───────────────────────────────────────── */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-coral text-sm font-semibold uppercase tracking-wider mb-2">Browse by</p>
            <h2 className="section-title">Categories</h2>
          </div>
          <Link to="/shop" className="hidden sm:flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-coral transition-colors">
            All categories <ArrowRight size={16} />
          </Link>
        </div>
        <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
          {(catData?.categories || []).map((cat, i) => (
            <CategoryPill key={cat.id} cat={cat} index={i} />
          ))}
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ─────────────────────────────────── */}
      {featuredData?.products?.length > 0 && (
        <section className="py-16 px-6 max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-coral text-sm font-semibold uppercase tracking-wider mb-2">Hand-picked</p>
              <h2 className="section-title">Featured Products</h2>
            </div>
            <Link to="/shop?featured=true" className="hidden sm:flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-coral transition-colors">
              View all <ArrowRight size={16} />
            </Link>
          </div>
          <div className="products-grid">
            {featuredData.products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* ── PROMO BANNER ─────────────────────────────────────── */}
      <section className="py-8 px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden noise"
          style={{ background: 'linear-gradient(135deg, #0D0D0D 0%, #1E1E3E 100%)' }}
        >
          <div className="absolute inset-0">
            <Orb color="#FF6B6B" size={400} top="-40%" left="60%" delay={0} />
            <Orb color="#4ECDC4" size={300} top="50%"  left="-10%" delay={2} />
          </div>
          <div className="relative z-10 px-8 py-14 md:py-20 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <p className="text-amber text-sm font-semibold uppercase tracking-widest mb-3">Loyalty Rewards</p>
              <h2 className="font-display font-bold text-white text-4xl md:text-5xl mb-4 leading-tight">
                Spend more,<br />save more
              </h2>
              <p className="text-white/60 max-w-md text-sm leading-relaxed">
                Purchase over <strong className="text-white">10 items</strong> or spend over{' '}
                <strong className="text-white">Rp 500.000</strong> and unlock exclusive discount coupons — up to <strong className="text-amber">20% off</strong>!
              </p>
            </div>
            <div className="flex flex-col gap-4 shrink-0">
              {[
                { label: '10% OFF', desc: '>10 orders or >Rp 500K spent', color: '#4ECDC4' },
                { label: '20% OFF', desc: '>20 orders or >Rp 1M spent', color: '#FFB347' },
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3">
                  <span className="font-display font-bold text-2xl" style={{ color: t.color }}>{t.label}</span>
                  <span className="text-white/60 text-sm">{t.desc}</span>
                </div>
              ))}
              <button onClick={() => navigate('/shop')} className="btn-primary mt-2 justify-center">
                Start Shopping <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── TRENDING ─────────────────────────────────────────── */}
      {trendingData?.products?.length > 0 && (
        <section className="py-16 px-6 max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-coral text-sm font-semibold uppercase tracking-wider mb-2">Most Popular</p>
              <h2 className="section-title flex items-center gap-3">
                <TrendingUp size={28} className="text-coral" />
                Trending Now
              </h2>
            </div>
            <Link to="/shop?sort=popular" className="hidden sm:flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-coral transition-colors">
              See all <ArrowRight size={16} />
            </Link>
          </div>
          <div className="products-grid">
            {trendingData.products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* ── PERSONALISED RECOMMENDATIONS ─────────────────────── */}
      {recData?.recommendations?.length > 0 && (
        <section className="py-16 px-6 max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-coral text-sm font-semibold uppercase tracking-wider mb-2">Just for you</p>
              <h2 className="section-title flex items-center gap-3">
                <Sparkles size={24} className="text-coral" />
                Recommended
              </h2>
            </div>
          </div>
          <div className="products-grid">
            {recData.recommendations.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '🤖', title: 'AI Recommendations', desc: 'Our engine learns your style and surfaces products you\'ll love based on browsing & purchase history.' },
            { icon: '🔒', title: 'Secure Payments', desc: 'All transactions are processed through Midtrans with bank-grade encryption and real-time tracking.' },
            { icon: '🎁', title: 'Loyalty Rewards', desc: 'Earn automatic discount coupons as you shop. The more you buy, the more you save — automatically.' },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="text-4xl mb-5">{f.icon}</div>
              <h3 className="font-display font-bold text-xl mb-3">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
