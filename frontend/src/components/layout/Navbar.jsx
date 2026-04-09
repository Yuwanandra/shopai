import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Search, User, Menu, X, Sparkles, Heart, Package } from 'lucide-react';
import { useAuthStore, useCartStore, useUIStore } from '../../store';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import CurrencySwitcher from '../ui/CurrencySwitcher';
import LanguageSwitcher from '../ui/LanguageSwitcher';

export default function Navbar() {
  const navigate      = useNavigate();
  const location      = useLocation();
  const { user, logout } = useAuthStore();
  const { itemCount } = useCartStore();
  const { toggleChat, toggleSearch } = useUIStore();

  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [userOpen,    setUserOpen]    = useState(false);
  const [searchVal,   setSearchVal]   = useState('');
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [prevCount,   setPrevCount]   = useState(0);
  const [cartPop,     setCartPop]     = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserOpen(false);
  }, [location.pathname]);

  // Cart count pop animation
  useEffect(() => {
    const count = itemCount();
    if (count > prevCount) {
      setCartPop(true);
      setTimeout(() => setCartPop(false), 350);
    }
    setPrevCount(count);
  }, [itemCount()]);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 100);
  }, [searchOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchVal.trim())}`);
      setSearchOpen(false);
      setSearchVal('');
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out!');
    navigate('/');
  };

  const count = itemCount();

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass border-b border-white/40 shadow-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-coral flex items-center justify-center shadow-md shadow-coral/30">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl text-ink">Shop<span className="text-coral">AI</span></span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { to: '/',      label: 'Home' },
              { to: '/shop',  label: 'Shop' },
              { to: '/about', label: 'About' },
              { to: '/help',  label: 'Help' },
            ].map(({ to, label }) => (
              <Link
                key={to} to={to}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  location.pathname === to
                    ? 'bg-coral text-white shadow-md shadow-coral/20'
                    : 'text-ink hover:bg-cream-dark'
                }`}
              >
                {label}
              </Link>
            ))}
            {user?.role === 'admin' && (
              <Link to="/admin" className="px-4 py-2 rounded-xl text-sm font-medium text-amber hover:bg-amber/10 transition-all">
                Admin
              </Link>
            )}
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xs">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchRef}
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                placeholder="Search products…"
                className="input-field pl-9 py-2 text-sm h-10"
              />
            </form>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {/* Currency Switcher */}
            <CurrencySwitcher />

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Mobile search */}
            <button
              onClick={() => setSearchOpen(s => !s)}
              className="md:hidden btn-ghost p-2 rounded-xl"
              aria-label="Search"
            >
              <Search size={20} />
            </button>

            {/* AI Chat */}
            <button
              onClick={toggleChat}
              className="btn-ghost p-2 rounded-xl relative"
              aria-label="AI Shopping Assistant"
            >
              <Sparkles size={20} className="text-coral" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-teal rounded-full animate-pulse-slow" />
            </button>

            {/* Cart */}
            <Link to="/cart" className="btn-ghost p-2 rounded-xl relative" aria-label="Cart">
              <ShoppingCart size={20} />
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 
                    bg-coral text-white text-[10px] font-bold rounded-full 
                    flex items-center justify-center ${cartPop ? 'badge-pop' : ''}`}
                >
                  {count > 99 ? '99+' : count}
                </motion.span>
              )}
            </Link>

            {/* User menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserOpen(o => !o)}
                  className="flex items-center gap-2 btn-ghost rounded-xl px-2 py-1.5"
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.username}
                      className="w-7 h-7 rounded-full object-cover border-2 border-coral/30" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-coral/15 flex items-center justify-center">
                      <span className="text-coral text-xs font-bold">
                        {user.username?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="hidden lg:block text-sm font-medium max-w-[80px] truncate">
                    {user.full_name || user.username}
                  </span>
                </button>

                <AnimatePresence>
                  {userOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-ink truncate">{user.full_name}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                      {[
                        { to: '/account', icon: User, label: 'My Account' },
                        { to: '/orders',  icon: Package, label: 'My Orders' },
                      ].map(({ to, icon: Icon, label }) => (
                        <Link key={to} to={to}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-cream-dark transition-colors"
                        >
                          <Icon size={15} className="text-coral" />
                          {label}
                        </Link>
                      ))}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100"
                      >
                        <X size={15} />
                        Log out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login"    className="btn-ghost text-sm px-3 py-2">Log in</Link>
                <Link to="/register" className="btn-primary text-sm px-4 py-2">Sign up</Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="md:hidden btn-ghost p-2 rounded-xl"
              aria-label="Menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Search Dropdown */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-white/30 overflow-hidden"
            >
              <form onSubmit={handleSearch} className="px-4 py-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    ref={searchRef}
                    value={searchVal}
                    onChange={e => setSearchVal(e.target.value)}
                    placeholder="Search products…"
                    className="input-field pl-9 text-sm h-10 bg-white/90"
                  />
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-cream border-t border-gray-100 overflow-hidden"
            >
              <div className="px-4 py-4 flex flex-col gap-1">
                {[
                  { to: '/', label: 'Home' },
                  { to: '/shop', label: 'Shop' },
                  { to: '/about', label: 'About' },
                ].map(({ to, label }) => (
                  <Link key={to} to={to}
                    className="px-4 py-3 rounded-xl text-sm font-medium text-ink hover:bg-cream-dark"
                  >{label}</Link>
                ))}
                {!user ? (
                  <div className="flex gap-2 mt-2">
                    <Link to="/login"    className="btn-outline flex-1 text-center text-sm py-2.5">Log in</Link>
                    <Link to="/register" className="btn-primary flex-1 text-center text-sm py-2.5">Sign up</Link>
                  </div>
                ) : (
                  <>
                    <Link to="/account" className="px-4 py-3 rounded-xl text-sm font-medium text-ink hover:bg-cream-dark">Account</Link>
                    <Link to="/orders"  className="px-4 py-3 rounded-xl text-sm font-medium text-ink hover:bg-cream-dark">Orders</Link>
                    <button onClick={handleLogout} className="px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 text-left">Log out</button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Backdrop for dropdown close */}
      {userOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setUserOpen(false)} />
      )}
    </>
  );
}