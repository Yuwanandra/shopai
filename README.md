# 🛍️ ShopAI — Full-Stack AI-Powered Shopping Platform

> React + Node.js + PostgreSQL + Anthropic Claude + Midtrans

A production-ready e-commerce platform with a custom-tuned GenAI shopping assistant, personalized recommendation engine, loyalty coupon system, and real payment processing via Midtrans.

---

## 🏗️ Architecture Overview

```
shopai/
├── database/
│   └── schema.sql          ← PostgreSQL schema + triggers + seed data
├── backend/                ← Node.js / Express API
│   ├── src/
│   │   ├── server.js       ← Express app entry point
│   │   ├── db.js           ← pg Pool connection
│   │   ├── middleware/
│   │   │   └── auth.js     ← JWT middleware (authenticate, requireAdmin, optionalAuth)
│   │   ├── routes/
│   │   │   ├── auth.js         ← Register / Login / Logout (bcrypt hashing)
│   │   │   ├── products.js     ← List, search, filter, single product, track interaction
│   │   │   ├── categories.js   ← Category listing
│   │   │   ├── cart.js         ← Persistent cart (server-synced)
│   │   │   ├── orders.js       ← Order creation + Midtrans Snap integration + webhook
│   │   │   ├── reviews.js      ← Star ratings + comments (stored in DB)
│   │   │   ├── recommendations.js ← Hybrid collaborative + content-based engine
│   │   │   ├── ai.js           ← Anthropic Claude streaming chatbot (SSE)
│   │   │   ├── coupons.js      ← Loyalty coupon system
│   │   │   ├── users.js        ← Profile edit, password change
│   │   │   ├── wishlists.js    ← Wishlist CRUD
│   │   │   └── admin.js        ← Admin CRUD: products, orders, users, stats
│   │   └── seeds/
│   │       └── seed.js         ← Sample products seeder
│   ├── vercel.json
│   └── Dockerfile
├── frontend/               ← React 18 + Vite + Tailwind CSS
│   ├── src/
│   │   ├── main.jsx        ← Entry + React Query + Toaster
│   │   ├── App.jsx         ← Router + auth guards
│   │   ├── index.css       ← Design system: tokens, animations, components
│   │   ├── lib/
│   │   │   └── api.js      ← Axios instance with JWT interceptor
│   │   ├── store/
│   │   │   └── index.js    ← Zustand: auth, cart, UI state
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx      ← Sticky nav, search, cart badge, user menu
│   │   │   │   └── Footer.jsx      ← Marquee banner, links
│   │   │   ├── products/
│   │   │   │   └── ProductCard.jsx ← Animated cards with hover overlay, wishlist, add-to-cart
│   │   │   └── ai/
│   │   │       └── AIChat.jsx      ← Floating chatbot with SSE streaming + suggestions
│   │   └── pages/
│   │       ├── HomePage.jsx    ← Hero parallax, categories, featured, trending, recommendations
│   │       ├── ShopPage.jsx    ← Filter sidebar, search, sort, pagination
│   │       ├── ProductPage.jsx ← Gallery, ratings breakdown, review form, similar products
│   │       ├── CartPage.jsx    ← Cart items, coupon validation, order summary
│   │       ├── CheckoutPage.jsx← Shipping form + Midtrans Snap.js integration
│   │       ├── AccountPage.jsx ← Profile / password / coupons / wishlist tabs
│   │       ├── OrdersPage.jsx  ← Order history with expandable details
│   │       ├── AboutPage.jsx   ← Brand story, values, contact
│   │       ├── LoginPage.jsx   ← Auth form
│   │       ├── RegisterPage.jsx← Registration with validation
│   │       ├── AdminPage.jsx   ← Dashboard, products CRUD, orders mgmt, users
│   │       └── NotFoundPage.jsx← Animated 404
│   ├── vercel.json
│   ├── netlify.toml
│   └── tailwind.config.js
└── docker-compose.yml      ← Local dev with PostgreSQL
```

---

## ⚙️ Tech Stack

| Layer       | Technology |
|-------------|------------|
| Frontend    | React 18, Vite, Tailwind CSS, Framer Motion |
| State       | Zustand (persist), React Query (server state) |
| Backend     | Node.js, Express 4, JWT, bcrypt (12 rounds) |
| Database    | PostgreSQL 16 with triggers, UUID, pgcrypto |
| AI          | Anthropic Claude (claude-sonnet) via SSE streaming |
| Payments    | Midtrans Snap.js (Sandbox & Production) |
| Deployment  | Vercel (frontend + backend) or Netlify (frontend) |
| Container   | Docker + docker-compose |

---

## 🚀 Quick Start (Local)

### Prerequisites
- Node.js ≥ 18
- PostgreSQL 14+ (or Docker)
- Anthropic API key
- Midtrans Sandbox account

### 1. Clone & Install
```bash
git clone https://github.com/yourname/shopai.git
cd shopai
npm run install:all
```

### 2. Database Setup

**Option A — Docker (recommended):**
```bash
# Copy .env files first (see step 3)
npm run docker:up
# PostgreSQL starts on port 5432, schema auto-applied
```

**Option B — Manual:**
```bash
createdb shopai_db
psql shopai_db -f database/schema.sql
```

### 3. Configure Environment Variables

**Backend** — copy `backend/.env.example` → `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/shopai_db
JWT_SECRET=your-super-secret-32-char-key
ANTHROPIC_API_KEY=sk-ant-...
MIDTRANS_SERVER_KEY=SB-Mid-server-...
MIDTRANS_CLIENT_KEY=SB-Mid-client-...
FRONTEND_URL=http://localhost:3000
```

**Frontend** — copy `frontend/.env.example` → `frontend/.env`:
```env
VITE_API_URL=
VITE_MIDTRANS_CLIENT_KEY=SB-Mid-client-...
```
> Leave `VITE_API_URL` empty in development — Vite proxies `/api` → `localhost:5000`

### 4. Seed Sample Data
```bash
cd backend && npm run db:seed
```

### 5. Start Dev Servers
```bash
# From root
npm run dev
# Backend:  http://localhost:5000
# Frontend: http://localhost:3000
```

### 6. Default Admin Account
```
Email:    admin@shopai.id
Password: Admin@123
```

---

## 🌐 Deployment

### Deploy Backend → Vercel

```bash
cd backend
vercel --prod

# Set environment variables in Vercel dashboard:
# DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY,
# MIDTRANS_SERVER_KEY, MIDTRANS_CLIENT_KEY, FRONTEND_URL
```

### Deploy Frontend → Vercel
```bash
cd frontend

# Set env vars:
# VITE_API_URL=https://your-backend.vercel.app/api
# VITE_MIDTRANS_CLIENT_KEY=SB-Mid-client-...

vercel --prod
```

### Deploy Frontend → Netlify
```bash
cd frontend
# Connect repo in Netlify dashboard
# Build command:  npm run build
# Publish dir:    dist
# Set same env vars as above
```

### Hosted PostgreSQL Options
- **Supabase** (free tier, managed): `https://supabase.com`
- **Neon** (serverless Postgres): `https://neon.tech`
- **Railway**: `https://railway.app`
- **Render**: `https://render.com`

> After provisioning, run schema: `psql YOUR_DB_URL -f database/schema.sql`

### Midtrans Webhook
In your Midtrans dashboard → Settings → Configuration:
```
Notification URL: https://your-backend.vercel.app/api/orders/webhook/midtrans
```

---

## 🤖 AI Chatbot (LoRA-style Prompt Tuning)

The chatbot uses **Anthropic Claude** with a heavily engineered system prompt that acts like a LoRA fine-tune — constraining the model to:

- Only discuss shopping-related topics
- Format product references as clickable `<action>` tags
- Support IDR/USD budget parsing
- Inject live product catalog context per request
- Reference the user's browsing history (if logged in)
- End every reply with 1-2 follow-up suggestion chips

Responses are **streamed via Server-Sent Events (SSE)** for real-time typing effect.

**To use a real LoRA fine-tuned model**, replace the `anthropic.messages.stream()` call in `backend/src/routes/ai.js` with your fine-tuned model endpoint (AWS Bedrock custom model, Hugging Face Inference Endpoint, etc.).

---

## 🧠 Recommendation Engine

The hybrid engine in `backend/src/routes/recommendations.js` scores products using:

| Signal | Weight |
|--------|--------|
| View interaction | +1 |
| Click interaction | +2 |
| Add to cart | +3 |
| Wishlist | +2 |
| Purchase | +5 |
| Same category as history | +40 |
| Tag overlap | +10 per tag |
| Purchase count | ×0.5 |
| Avg rating | ×5 |

Falls back to trending products for anonymous users.

---

## 🎟️ Coupon System

Coupons are **auto-generated via PostgreSQL triggers** when a payment is confirmed:

| Threshold | Reward |
|-----------|--------|
| >10 orders OR >Rp 500,000 spent | 10% off (90-day expiry) |
| >20 orders OR >Rp 1,000,000 spent | 20% off (90-day expiry) |

Coupons are stored in `coupons` + `user_coupons` tables and validated on checkout.

---

## 🔒 Security

- Passwords hashed with **bcrypt** (12 salt rounds)
- JWT tokens with `httpOnly` cookie + `Authorization` header support
- Helmet.js for HTTP security headers
- Rate limiting: 200 req/15min globally, 20 req/min on AI endpoint
- Input validation via `express-validator`
- SQL injection prevention via parameterized queries (`pg`)
- CORS restricted to frontend origin

---

## 📊 Database Schema Summary

| Table | Purpose |
|-------|---------|
| `users` | Auth, profile, total_spent, total_orders |
| `categories` | Product taxonomy |
| `products` | Full product catalog with avg_rating auto-computed |
| `user_interactions` | Click/view/cart/purchase events for recommendations |
| `reviews` | Star ratings + comments per product per user |
| `orders` | Order lifecycle + Midtrans tracking |
| `order_items` | Line items per order |
| `cart_items` | Persistent server-side cart |
| `coupons` | Discount codes (percentage or fixed) |
| `user_coupons` | Assignment + usage tracking |
| `wishlists` | User saved products |
| `ai_sessions` | AI chat history per session |

---

## 📄 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ✗ | Register user |
| POST | `/api/auth/login` | ✗ | Login, returns JWT |
| GET | `/api/products` | Optional | List/search products |
| GET | `/api/products/:slug` | Optional | Product detail + track view |
| POST | `/api/products/:id/interact` | Optional | Track click/cart/wishlist |
| GET | `/api/recommendations` | Optional | Personalized recommendations |
| POST | `/api/ai/chat` | Optional | SSE streaming AI chat |
| GET | `/api/ai/suggestions` | ✗ | Chatbot suggestion chips |
| GET | `/api/cart` | ✓ | Get cart items |
| POST | `/api/cart/add` | ✓ | Add to cart |
| POST | `/api/orders` | ✓ | Create order + Midtrans token |
| POST | `/api/orders/webhook/midtrans` | ✗ | Midtrans payment webhook |
| POST | `/api/reviews/product/:id` | ✓ | Post review |
| POST | `/api/coupons/validate` | ✓ | Validate coupon code |
| GET | `/api/admin/stats` | Admin | Dashboard metrics |
| POST | `/api/admin/products` | Admin | Create product |
| PUT | `/api/admin/products/:id` | Admin | Update product |

---

## 🎨 Design System

Defined in `frontend/src/index.css` using CSS custom properties:

```css
--coral:   #FF6B6B   /* Primary CTA, badges, ratings */
--amber:   #FFB347   /* Warnings, featured, stars */
--teal:    #4ECDC4   /* Success, verified badges */
--ink:     #0D0D0D   /* Text, dark backgrounds */
--cream:   #FFF8F0   /* Page background */
```

Product cards use a custom **spring-physics hover animation** (`cubic-bezier(0.34, 1.56, 0.64, 1)`) with scale + translateY + image zoom + overlay reveal.

---

## 📝 License

MIT — free to use, modify, and deploy commercially.
