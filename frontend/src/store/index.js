import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

// ── Auth Store ────────────────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user:  null,
      token: null,

      setAuth: (user, token) => {
        localStorage.setItem('shopai_token', token);
        set({ user, token });
      },

      logout: async () => {
        try { await api.post('/auth/logout'); } catch (_) {}
        localStorage.removeItem('shopai_token');
        localStorage.removeItem('shopai_user');
        set({ user: null, token: null });
      },

      updateUser: (partial) => set((s) => ({ user: { ...s.user, ...partial } })),

      isAdmin: () => get().user?.role === 'admin',
    }),
    { name: 'shopai_user', partialize: (s) => ({ user: s.user, token: s.token }) }
  )
);

// ── Cart Store ────────────────────────────────────────────────
export const useCartStore = create((set, get) => ({
  items:   [],
  loading: false,

  setItems: (items) => set({ items }),

  addItem: (product, qty = 1) => {
    const items = get().items;
    const idx   = items.findIndex((i) => i.product_id === product.id);
    if (idx >= 0) {
      const updated = [...items];
      updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + qty };
      set({ items: updated });
    } else {
      set({
        items: [...items, {
          id: `local_${product.id}`, product_id: product.id,
          name: product.name, price: product.price,
          image_url: product.image_url, slug: product.slug,
          quantity: qty, stock: product.stock,
        }],
      });
    }
  },

  removeItem: (cartItemId) =>
    set((s) => ({ items: s.items.filter((i) => i.id !== cartItemId) })),

  updateQty: (cartItemId, qty) =>
    set((s) => ({
      items: s.items.map((i) => i.id === cartItemId ? { ...i, quantity: qty } : i),
    })),

  clearCart: () => set({ items: [] }),

  total:     () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
  itemCount: () => get().items.reduce((s, i) => s + i.quantity, 0),
}));

// ── UI Store ─────────────────────────────────────────────────
export const useUIStore = create((set) => ({
  chatOpen:    false,
  searchOpen:  false,
  mobileMenuOpen: false,

  toggleChat:      () => set((s) => ({ chatOpen: !s.chatOpen })),
  toggleSearch:    () => set((s) => ({ searchOpen: !s.searchOpen })),
  toggleMobileMenu:() => set((s) => ({ mobileMenuOpen: !s.mobileMenuOpen })),
  closeAll:        () => set({ chatOpen: false, searchOpen: false, mobileMenuOpen: false }),
}));
