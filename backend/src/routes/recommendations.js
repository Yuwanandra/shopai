const router = require('express').Router();
const db     = require('../db');
const { optionalAuth } = require('../middleware/auth');

/**
 * Collaborative + Content-based hybrid recommendation engine.
 * 
 * Scoring:
 *   - User interaction history (click=2, cart=3, purchase=5, view=1)
 *   - Category affinity (same category as interacted products)
 *   - Tag overlap with previously interacted items
 *   - Trending (purchase_count + view_count in last 7 days)
 *   - Exclude already-purchased or currently-viewed product
 */
router.get('/', optionalAuth, async (req, res) => {
  const { product_id, limit = 12 } = req.query;
  const userId = req.user?.id;
  const sessionId = req.headers['x-session-id'];

  try {
    // ── Personalised: user has interactions ─────────────────
    if (userId || sessionId) {
      const identifier = userId ? 'user_id = $1' : 'session_id = $1';
      const idVal      = userId || sessionId;

      // Get user's top interacted categories & tags
      const { rows: history } = await db.query(`
        SELECT DISTINCT p.category_id, p.tags, ui.weight
        FROM user_interactions ui
        JOIN products p ON p.id = ui.product_id
        WHERE ui.${identifier}
        ORDER BY ui.weight DESC
        LIMIT 50
      `, [idVal]);

      const categoryIds = [...new Set(history.map(r => r.category_id).filter(Boolean))];
      const allTags     = history.flatMap(r => r.tags || []);
      const tagFreq     = allTags.reduce((acc, t) => { acc[t] = (acc[t]||0)+1; return acc; }, {});
      const topTags     = Object.entries(tagFreq).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([t])=>t);

      const { rows: interactedIds } = await db.query(`
        SELECT DISTINCT product_id FROM user_interactions
        WHERE ${identifier}
      `, [idVal]);
      const excludeIds = interactedIds.map(r => r.product_id);
      if (product_id) excludeIds.push(product_id);

      const excludePlaceholders = excludeIds.map((_, i) => `$${i+2}`).join(',') || 'NULL';

      const { rows: recs } = await db.query(`
        SELECT p.id, p.name, p.slug, p.price, p.original_price,
               p.image_url, p.avg_rating, p.review_count, p.stock,
               c.name AS category_name, c.slug AS category_slug,
               (
                 CASE WHEN p.category_id = ANY($1::int[]) THEN 40 ELSE 0 END
                 + (ARRAY_LENGTH(ARRAY(SELECT UNNEST(p.tags) INTERSECT SELECT UNNEST($2::text[])),1) * 10)
                 + (p.purchase_count * 0.5)
                 + (p.avg_rating * 5)
               ) AS score
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.is_active = TRUE
          AND p.id NOT IN (${excludePlaceholders})
        ORDER BY score DESC, p.purchase_count DESC
        LIMIT $${excludeIds.length + 3}
      `, [categoryIds, topTags, ...excludeIds, parseInt(limit)]);

      if (recs.length >= 4) return res.json({ recommendations: recs });
    }

    // ── Product-similar fallback ─────────────────────────────
    if (product_id) {
      const { rows: base } = await db.query(
        'SELECT category_id, tags FROM products WHERE id=$1', [product_id]
      );
      if (base.length) {
        const { rows } = await db.query(`
          SELECT p.id, p.name, p.slug, p.price, p.original_price,
                 p.image_url, p.avg_rating, p.review_count, p.stock,
                 c.name AS category_name, c.slug AS category_slug
          FROM products p
          LEFT JOIN categories c ON c.id = p.category_id
          WHERE p.is_active = TRUE
            AND p.id <> $1
            AND (p.category_id = $2 OR p.tags && $3::text[])
          ORDER BY p.purchase_count DESC, p.avg_rating DESC
          LIMIT $4
        `, [product_id, base[0].category_id, base[0].tags || [], parseInt(limit)]);
        return res.json({ recommendations: rows });
      }
    }

    // ── Trending fallback ────────────────────────────────────
    const { rows: trending } = await db.query(`
      SELECT p.id, p.name, p.slug, p.price, p.original_price,
             p.image_url, p.avg_rating, p.review_count, p.stock,
             c.name AS category_name, c.slug AS category_slug
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.is_active = TRUE
      ORDER BY (p.purchase_count * 2 + p.view_count + p.avg_rating * 10) DESC
      LIMIT $1
    `, [parseInt(limit)]);

    res.json({ recommendations: trending });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Recommendation engine error' });
  }
});

module.exports = router;
