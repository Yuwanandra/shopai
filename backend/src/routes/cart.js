const router = require('express').Router();
const db     = require('../db');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  const { rows } = await db.query(`
    SELECT ci.id, ci.quantity, p.id AS product_id, p.name, p.price,
           p.original_price, p.image_url, p.stock, p.slug,
           c.name AS category_name
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE ci.user_id = $1 AND p.is_active = TRUE
    ORDER BY ci.created_at DESC
  `, [req.user.id]);
  res.json({ items: rows });
});

router.post('/add', authenticate, async (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  try {
    const { rows } = await db.query(`
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES ($1,$2,$3)
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET quantity = cart_items.quantity + $3, updated_at = NOW()
      RETURNING *
    `, [req.user.id, product_id, quantity]);
    // Track cart interaction
    db.query(`INSERT INTO user_interactions (user_id, product_id, interaction, weight) VALUES ($1,$2,'cart',3)`,
      [req.user.id, product_id]).catch(()=>{});
    res.json({ item: rows[0] });
  } catch (err) { res.status(500).json({ error: 'Failed to add to cart' }); }
});

router.patch('/:id', authenticate, async (req, res) => {
  const { quantity } = req.body;
  if (quantity < 1) return res.status(400).json({ error: 'Quantity must be >= 1' });
  const { rows } = await db.query(
    'UPDATE cart_items SET quantity=$1, updated_at=NOW() WHERE id=$2 AND user_id=$3 RETURNING *',
    [quantity, req.params.id, req.user.id]
  );
  res.json({ item: rows[0] });
});

router.delete('/:id', authenticate, async (req, res) => {
  await db.query('DELETE FROM cart_items WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  res.json({ ok: true });
});

router.delete('/', authenticate, async (req, res) => {
  await db.query('DELETE FROM cart_items WHERE user_id=$1', [req.user.id]);
  res.json({ ok: true });
});

module.exports = router;
