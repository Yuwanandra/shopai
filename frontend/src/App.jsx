import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import Navbar        from './components/layout/Navbar';
import Footer        from './components/layout/Footer';
import AIChat        from './components/ai/AIChat';

import HomePage      from './pages/HomePage';
import ShopPage      from './pages/ShopPage';
import ProductPage   from './pages/ProductPage';
import CartPage      from './pages/CartPage';
import CheckoutPage  from './pages/CheckoutPage';
import AccountPage   from './pages/AccountPage';
import OrdersPage    from './pages/OrdersPage';
import AboutPage     from './pages/AboutPage';
import LoginPage     from './pages/LoginPage';
import RegisterPage  from './pages/RegisterPage';
import AdminPage     from './pages/AdminPage';
import NotFoundPage  from './pages/NotFoundPage';

import { useAuthStore, useCartStore } from './store';
import api from './lib/api';

// ── Protected route ───────────────────────────────────────────
function Protected({ children, adminOnly = false }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user } = useAuthStore();
  const { setItems } = useCartStore();

  // Sync cart from server when logged in
  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn:  () => api.get('/cart').then(r => r.data),
    enabled:  !!user,
  });

  useEffect(() => {
    if (cartData?.items) setItems(cartData.items);
  }, [cartData, setItems]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/"            element={<HomePage />} />
          <Route path="/shop"        element={<ShopPage />} />
          <Route path="/shop/:category" element={<ShopPage />} />
          <Route path="/product/:slug"  element={<ProductPage />} />
          <Route path="/cart"        element={<CartPage />} />
          <Route path="/about"       element={<AboutPage />} />
          <Route path="/login"       element={user ? <Navigate to="/" /> : <LoginPage />} />
          <Route path="/register"    element={user ? <Navigate to="/" /> : <RegisterPage />} />

          <Route path="/checkout" element={
            <Protected><CheckoutPage /></Protected>
          } />
          <Route path="/account" element={
            <Protected><AccountPage /></Protected>
          } />
          <Route path="/orders" element={
            <Protected><OrdersPage /></Protected>
          } />
          <Route path="/admin/*" element={
            <Protected adminOnly><AdminPage /></Protected>
          } />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      <AIChat />
    </div>
  );
}
