require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const path       = require('path');

const authRoutes        = require('./routes/auth');
const productRoutes     = require('./routes/products');
const categoryRoutes    = require('./routes/categories');
const cartRoutes        = require('./routes/cart');
const orderRoutes       = require('./routes/orders');
const reviewRoutes      = require('./routes/reviews');
const recommendRoutes   = require('./routes/recommendations');
const aiRoutes          = require('./routes/ai');
const adminRoutes       = require('./routes/admin');
const couponRoutes      = require('./routes/coupons');
const userRoutes        = require('./routes/users');
const wishlistRoutes    = require('./routes/wishlists');

const app = express();

// Trust Vercel's proxy
app.set('trust proxy', 1);

// ── Security ────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// ── CORS ────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','x-session-id'],
}));

// Handle preflight
app.options('*', cors());
// ── Body / Cookie / Compression ─────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// ── Logging ─────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// ── Static uploads ──────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


// ── Routes ──────────────────────────────────────────────────
app.use('/api/auth',            authRoutes);
app.use('/api/products',        productRoutes);
app.use('/api/categories',      categoryRoutes);
app.use('/api/cart',            cartRoutes);
app.use('/api/orders',          orderRoutes);
app.use('/api/reviews',         reviewRoutes);
app.use('/api/recommendations', recommendRoutes);
app.use('/api/ai',              aiRoutes);
app.use('/api/admin',           adminRoutes);
app.use('/api/coupons',         couponRoutes);
app.use('/api/users',           userRoutes);
app.use('/api/wishlists',       wishlistRoutes);

// ── Health check ────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));

// ── 404 ─────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Global error handler ─────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 ShopAI API running on port ${PORT}`));
}

// For Vercel serverless - export the app
module.exports = app;
