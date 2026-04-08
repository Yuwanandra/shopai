// ============================================================
// reviews.js
// ============================================================
const router = require('express').Router();
const db     = require('../db');
const { authenticate, optionalAuth } = require('../middleware/auth');

router.get('/product/:productId', optionalAuth, async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page-1)*limit;
  try {
    const { rows } = await db.query(`
      SELECT r.*, u.username, u.avatar_url
      FROM reviews r
      LEFT JOIN users u ON u.id = r.user_id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `, [req.params.productId, limit, offset]);
    const count = await db.query('SELECT COUNT(*) FROM reviews WHERE product_id=$1',[req.params.productId]);
    res.json({ reviews: rows, total: parseInt(count.rows[0].count) });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch reviews' }); }
});

router.post('/product/:productId', authenticate, async (req, res) => {
  const { rating, title, body, order_id } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating 1-5 required' });
  try {
    const { rows } = await db.query(`
      INSERT INTO reviews (product_id, user_id, order_id, rating, title, body, is_verified)
      VALUES ($1,$2,$3,$4,$5,$6, $7::boolean)
      RETURNING *
    `, [req.params.productId, req.user.id, order_id||null, rating, title, body, !!order_id]);
    res.status(201).json({ review: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Already reviewed' });
    res.status(500).json({ error: 'Failed to post review' });
  }
});

module.exports = router;
