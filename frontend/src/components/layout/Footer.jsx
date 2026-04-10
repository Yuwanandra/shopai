import { Link } from 'react-router-dom';
import { Sparkles, Instagram, Twitter, Github, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-ink text-white/70 mt-24">
      {/* Marquee banner */}
      <div className="overflow-hidden border-y border-white/10 py-3">
        <div className="marquee-inner gap-8 text-xs font-mono uppercase tracking-widest text-white/30">
          {Array(6).fill(['Free shipping over Rp 500K', '✦', 'AI-powered recommendations', '✦', 'Secure payments via Midtrans', '✦', 'Earn loyalty coupons', '✦']).flat().map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-coral flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white">Shop<span className="text-coral">AI</span></span>
          </div>
          <p className="text-sm leading-relaxed mb-6">
            Intelligent shopping powered by AI. Discover products tailored just for you.
          </p>
          <div className="flex gap-3">
            {[Instagram, Twitter, Github].map((Icon, i) => (
              <a key={i} href="#" className="w-9 h-9 rounded-xl border border-white/15 flex items-center justify-center hover:border-coral hover:text-coral transition-colors">
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        {/* Links */}
        {[
          {
            title: 'Shop',
            links: [
              { label: 'All Products', to: '/shop' },
              { label: 'Electronics',  to: '/shop/electronics' },
              { label: 'Fashion',       to: '/shop/fashion' },
              { label: 'Home & Living', to: '/shop/home-living' },
            ],
          },
          {
            title: 'Account',
            links: [
              { label: 'My Profile', to: '/account' },
              { label: 'My Orders',  to: '/orders' },
              { label: 'Wishlist',   to: '/account?tab=wishlist' },
              { label: 'Coupons',    to: '/account?tab=coupons' },
            ],
          },
          {
            title: 'Company',
            links: [
              { label: 'About Us',  to: '/about' },
              { label: 'Privacy',   to: '/about#privacy' },
              { label: 'Terms',     to: '/about#terms' },
              { label: 'Contact',   to: '/about#contact' },
            ],
          },
        ].map(({ title, links }) => (
          <div key={title}>
            <h4 className="text-white font-semibold mb-4 text-sm">{title}</h4>
            <ul className="space-y-2.5">
              {links.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-sm hover:text-coral transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 py-5">
  <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-3 text-xs text-white/30 text-center">
    {/* Disclaimer */}
    <div className="bg-white/5 border border-white/10 rounded-xl px-6 py-3 max-w-3xl text-white/40 leading-relaxed">
      ⚠️ <strong className="text-white/60">Demo Project Disclaimer:</strong> ShopAI is a portfolio demonstration project only. 
      This is <strong className="text-white/60">NOT</strong> a real e-commerce platform. All transactions are 
      <strong className="text-white/60"> simulated</strong> using Midtrans Sandbox — no real money is charged. 
      No real products are sold. This project is built for educational and portfolio purposes only and has no legal commercial standing.
    </div>
    <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
      <span>© {new Date().getFullYear()} ShopAI. All rights reserved.</span>
      <span className="flex items-center gap-1.5">
        Made with <Heart size={11} className="text-coral fill-coral" /> in Indonesia by Yuwanandra
      </span>
    </div>
  </div>
</div>
    </footer>
  );
}
