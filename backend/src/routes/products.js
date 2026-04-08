const router = require('express').Router();
const db     = require('../db');
const { optionalAuth } = require('../middleware/auth');

// ── List products (with filters, search, pagination) ─────────
router.get('/', optionalAuth, async (req, res) => {
  const {
    q, category, min_price, max_price, sort = 'created_at',
    order = 'desc', page = 1, limit = 24, featured,
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params = [];
  const where  = ['p.is_active = TRUE'];

  if (q) {
    params.push(`%${q}%`);
    where.push(`(p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`);
  }
  if (category) {
    params.push(category);
    where.push(`c.slug = $${params.length}`);
  }
  if (min_price) { params.push(min_price); where.push(`p.price >= $${params.length}`); }
  if (max_price) { params.push(max_price); where.push(`p.price <= $${params.length}`); }
  if (featured === 'true') where.push('p.is_featured = TRUE');

  const allowedSort = { created_at:'p.created_at', price:'p.price', rating:'p.avg_rating', popular:'p.purchase_count', name:'p.name' };
  const sortCol  = allowedSort[sort] || 'p.created_at';
  const sortDir  = order === 'asc' ? 'ASC' : 'DESC';

  params.push(parseInt(limit), offset);

  try {
    const sql = `
      SELECT p.id, p.name, p.slug, p.price, p.original_price,
             p.image_url, p.avg_rating, p.review_count, p.stock,
             p.is_featured, p.purchase_count, p.view_count,
             c.id AS category_id, c.name AS category_name, c.slug AS category_slug
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE ${where.join(' AND ')}
      ORDER BY ${sortCol} ${sortDir}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const countSql = `
      SELECT COUNT(*) FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE ${where.join(' AND ')}
    `;

    const [data, count] = await Promise.all([
      db.query(sql, params),
      db.query(countSql, params.slice(0, -2)),
    ]);

    res.json({
      products:   data.rows,
      total:      parseInt(count.rows[0].count),
      page:       parseInt(page),
      totalPages: Math.ceil(count.rows[0].count / parseInt(limit)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// ── Single product ───────────────────────────────────────────
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT p.*, c.name AS category_name, c.slug AS category_slug
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.slug = $1 AND p.is_active = TRUE
    `, [req.params.slug]);

    if (!rows.length) return res.status(404).json({ error: 'Product not found' });
    const product = rows[0];

    // Track view
    const userId    = req.user?.id || null;
    const sessionId = req.headers['x-session-id'] || null;
    db.query(
      `INSERT INTO user_interactions (user_id, product_id, session_id, interaction, weight)
       VALUES ($1,$2,$3,'view',1.0)`, [userId, product.id, sessionId]
    ).catch(() => {});
    db.query('UPDATE products SET view_count = view_count + 1 WHERE id = $1', [product.id]).catch(() => {});

    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// ── Track interaction (click / cart / wishlist) ───────────────
router.post('/:id/interact', optionalAuth, async (req, res) => {
  const { interaction } = req.body;
  const weights = { view:1, click:2, cart:3, wishlist:2, purchase:5 };
  if (!weights[interaction]) return res.status(400).json({ error: 'Invalid interaction' });

  try {
    await db.query(
      `INSERT INTO user_interactions (user_id, product_id, session_id, interaction, weight)
       VALUES ($1,$2,$3,$4,$5)`,
      [req.user?.id, req.params.id, req.headers['x-session-id'], interaction, weights[interaction]]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record interaction' });
  }
});

module.exports = router;
