// ── categories.js ────────────────────────────────────────────
const express  = require('express');
const catRouter = express.Router();
const db       = require('../db');

catRouter.get('/', async (_req, res) => {
  const { rows } = await db.query('SELECT * FROM categories ORDER BY sort_order ASC');
  res.json({ categories: rows });
});
catRouter.get('/:slug', async (req, res) => {
  const { rows } = await db.query('SELECT * FROM categories WHERE slug=$1',[req.params.slug]);
  if (!rows.length) return res.status(404).json({ error:'Not found' });
  res.json({ category: rows[0] });
});

module.exports.categoryRouter = catRouter;

// ── coupons.js ───────────────────────────────────────────────
const couponRouter = express.Router();
const { authenticate } = require('../middleware/auth');

couponRouter.get('/my', authenticate, async (req, res) => {
  const { rows } = await db.query(`
    SELECT c.*, uc.is_used, uc.used_at, uc.assigned_at
    FROM user_coupons uc JOIN coupons c ON c.id=uc.coupon_id
    WHERE uc.user_id=$1 AND c.is_active=TRUE AND (c.expires_at IS NULL OR c.expires_at > NOW())
    ORDER BY uc.assigned_at DESC
  `, [req.user.id]);
  res.json({ coupons: rows });
});

couponRouter.post('/validate', authenticate, async (req, res) => {
  const { code, subtotal } = req.body;
  try {
    const { rows } = await db.query(`
      SELECT c.*, uc.is_used FROM coupons c
      LEFT JOIN user_coupons uc ON uc.coupon_id=c.id AND uc.user_id=$1
      WHERE c.code=$2 AND c.is_active=TRUE AND (c.expires_at IS NULL OR c.expires_at > NOW())
    `, [req.user.id, code]);
    if (!rows.length) return res.status(404).json({ error: 'Invalid or expired coupon' });
    const c = rows[0];
    if (c.is_used) return res.status(400).json({ error: 'Coupon already used' });
    if (subtotal < c.min_purchase) return res.status(400).json({ error: `Minimum purchase Rp ${c.min_purchase.toLocaleString()}` });
    const discount = c.type === 'percentage' ? Math.round(subtotal * c.value / 100) : Math.min(c.value, subtotal);
    res.json({ valid: true, coupon: c, discount });
  } catch (err) { res.status(500).json({ error: 'Validation failed' }); }
});

module.exports.couponRouter = couponRouter;

// ── users.js ─────────────────────────────────────────────────
const userRouter = express.Router();
const bcrypt = require('bcrypt');

userRouter.get('/profile', authenticate, async (req, res) => {
  const { rows } = await db.query(
    'SELECT id,email,username,full_name,avatar_url,phone,address,role,total_spent,total_orders,created_at FROM users WHERE id=$1',
    [req.user.id]
  );
  res.json({ user: rows[0] });
});

userRouter.put('/profile', authenticate, async (req, res) => {
  const { full_name, phone, address, avatar_url } = req.body;
  const { rows } = await db.query(`
    UPDATE users SET full_name=$1, phone=$2, address=$3, avatar_url=$4, updated_at=NOW()
    WHERE id=$5 RETURNING id,email,username,full_name,avatar_url,phone,address,role
  `, [full_name, phone, address, avatar_url, req.user.id]);
  res.json({ user: rows[0] });
});

userRouter.put('/password', authenticate, async (req, res) => {
  const { current_password, new_password } = req.body;
  try {
    const { rows } = await db.query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
    const ok = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!ok) return res.status(400).json({ error: 'Current password incorrect' });
    if (new_password.length < 8) return res.status(400).json({ error: 'Password too short' });
    const hash = await bcrypt.hash(new_password, 12);
    await db.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.user.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Password update failed' }); }
});

module.exports.userRouter = userRouter;

// ── wishlists.js ─────────────────────────────────────────────
const wishRouter = express.Router();

wishRouter.get('/', authenticate, async (req, res) => {
  const { rows } = await db.query(`
    SELECT w.id, p.id AS product_id, p.name, p.slug, p.price, p.image_url, p.avg_rating, p.stock
    FROM wishlists w JOIN products p ON p.id=w.product_id
    WHERE w.user_id=$1
  `, [req.user.id]);
  res.json({ items: rows });
});

wishRouter.post('/:productId', authenticate, async (req, res) => {
  try {
    await db.query('INSERT INTO wishlists (user_id,product_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [req.user.id, req.params.productId]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

wishRouter.delete('/:productId', authenticate, async (req, res) => {
  await db.query('DELETE FROM wishlists WHERE user_id=$1 AND product_id=$2', [req.user.id, req.params.productId]);
  res.json({ ok: true });
});

module.exports.wishlistRouter = wishRouter;

// ── admin.js ─────────────────────────────────────────────────
const adminRouter = express.Router();
const { requireAdmin } = require('../middleware/auth');
const slugify = require('slugify');

adminRouter.use(authenticate, requireAdmin);

// Dashboard stats
adminRouter.get('/stats', async (_req, res) => {
  const [users, products, orders, revenue] = await Promise.all([
    db.query('SELECT COUNT(*) FROM users WHERE role=\'user\''),
    db.query('SELECT COUNT(*) FROM products WHERE is_active=TRUE'),
    db.query('SELECT COUNT(*) FROM orders'),
    db.query('SELECT COALESCE(SUM(total),0) AS total FROM orders WHERE payment_status=\'paid\''),
  ]);
  res.json({
    users:    parseInt(users.rows[0].count),
    products: parseInt(products.rows[0].count),
    orders:   parseInt(orders.rows[0].count),
    revenue:  parseFloat(revenue.rows[0].total),
  });
});

// List all products
adminRouter.get('/products', async (req, res) => {
  const { page=1, limit=20 } = req.query;
  const { rows } = await db.query(`
    SELECT p.*, c.name AS category_name FROM products p
    LEFT JOIN categories c ON c.id=p.category_id
    ORDER BY p.created_at DESC LIMIT $1 OFFSET $2
  `, [limit, (page-1)*limit]);
  res.json({ products: rows });
});

// Create product
adminRouter.post('/products', async (req, res) => {
  const { name, description, price, original_price, stock, category_id,
          image_url, images, tags, sku, weight_gram, is_featured } = req.body;
  const slug = slugify(name, { lower: true, strict: true }) + '-' + Date.now();
  try {
    const { rows } = await db.query(`
      INSERT INTO products (name,slug,description,price,original_price,stock,category_id,
        image_url,images,tags,sku,weight_gram,is_featured)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *
    `, [name,slug,description,price,original_price,stock,category_id,
        image_url,JSON.stringify(images||[]),tags||[],sku,weight_gram,is_featured||false]);
    res.status(201).json({ product: rows[0] });
  } catch (err) {
    if (err.code==='23505') return res.status(409).json({ error: 'SKU already exists' });
    res.status(500).json({ error: err.message });
  }
});

// Update product
adminRouter.put('/products/:id', async (req, res) => {
  const { name, description, price, original_price, stock, category_id,
          image_url, images, tags, is_active, is_featured } = req.body;

  // Convert empty strings to null for numeric fields
  const cleanPrice         = price          === '' ? null : price;
  const cleanOriginalPrice = original_price === '' ? null : original_price;
  const cleanStock         = stock          === '' ? null : stock;
  const cleanCategoryId    = category_id    === '' ? null : category_id;

  try {
    const { rows } = await db.query(`
      UPDATE products SET name=$1, description=$2, price=$3, original_price=$4,
        stock=$5, category_id=$6, image_url=$7, images=$8, tags=$9,
        is_active=$10, is_featured=$11, updated_at=NOW()
      WHERE id=$12 RETURNING *
    `, [name, description, cleanPrice, cleanOriginalPrice, cleanStock, cleanCategoryId,
        image_url, JSON.stringify(images||[]), tags||[], is_active, is_featured, req.params.id]);
    res.json({ product: rows[0] });
  } catch (err) {
    console.error('Update product error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Delete product
adminRouter.delete('/products/:id', async (req, res) => {
  await db.query('UPDATE products SET is_active=FALSE WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

// All orders
adminRouter.get('/orders', async (req, res) => {
  const { status, page=1, limit=20 } = req.query;
  const where = status ? `WHERE o.status='${status}'` : '';
  const { rows } = await db.query(`
    SELECT o.*, u.email, u.username FROM orders o
    LEFT JOIN users u ON u.id=o.user_id
    ${where} ORDER BY o.created_at DESC LIMIT $1 OFFSET $2
  `, [limit, (page-1)*limit]);
  res.json({ orders: rows });
});

adminRouter.patch('/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  const { rows } = await db.query(
    'UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
    [status, req.params.id]
  );
  res.json({ order: rows[0] });
});

// All users
adminRouter.get('/users', async (req, res) => {
  const { rows } = await db.query(
    'SELECT id,email,username,full_name,role,total_spent,total_orders,created_at FROM users ORDER BY created_at DESC LIMIT 100'
  );
  res.json({ users: rows });
});

module.exports.adminRouter = adminRouter;
