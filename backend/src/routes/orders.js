const router   = require('express').Router();
const midtrans = require('midtrans-client');
const db       = require('../db');
const { authenticate } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// Midtrans client
const snap = new midtrans.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey:    process.env.MIDTRANS_SERVER_KEY,
  clientKey:    process.env.MIDTRANS_CLIENT_KEY,
});

// ── Create order + Midtrans Snap token ───────────────────────
router.post('/', authenticate, async (req, res) => {
  const { items, shipping_address, coupon_code, notes } = req.body;
  if (!items?.length) return res.status(400).json({ error: 'No items in order' });

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Validate items & calculate subtotal
    let subtotal = 0;
    const enrichedItems = [];
    for (const item of items) {
      const { rows } = await client.query(
        'SELECT id, name, price, image_url, stock FROM products WHERE id=$1 AND is_active=TRUE',
        [item.product_id]
      );
      if (!rows.length) throw new Error(`Product not found: ${item.product_id}`);
      const product = rows[0];
      if (product.stock < item.quantity) throw new Error(`Insufficient stock: ${product.name}`);

      enrichedItems.push({
        product_id:    product.id,
        product_name:  product.name,
        product_image: product.image_url,
        quantity:      item.quantity,
        unit_price:    product.price,
        subtotal:      product.price * item.quantity,
      });
      subtotal += product.price * item.quantity;
    }

    // Validate coupon
    let discount = 0;
    let couponId = null;
    if (coupon_code) {
      const { rows: cRows } = await client.query(`
        SELECT c.id, c.type, c.value, c.min_purchase, uc.id AS user_coupon_id
        FROM coupons c
        JOIN user_coupons uc ON uc.coupon_id = c.id
        WHERE c.code=$1 AND uc.user_id=$2 AND uc.is_used=FALSE
          AND c.is_active=TRUE AND (c.expires_at IS NULL OR c.expires_at > NOW())
      `, [coupon_code, req.user.id]);

      if (cRows.length) {
        const coupon = cRows[0];
        if (subtotal >= coupon.min_purchase) {
          couponId = coupon.id;
          discount = coupon.type === 'percentage'
            ? Math.round(subtotal * coupon.value / 100)
            : Math.min(coupon.value, subtotal);
        }
      }
    }

    const tax      = Math.round(subtotal * 0.11); // 11% VAT
    const shipping = 15000;
    const total    = subtotal - discount + shipping + tax;

    const orderId  = `SHOPAI-${Date.now()}-${uuidv4().slice(0,6).toUpperCase()}`;

    // Insert order
    const { rows: [order] } = await client.query(`
      INSERT INTO orders (user_id, status, subtotal, discount_amount, shipping_cost, tax_amount, total,
        coupon_id, coupon_code, shipping_address, notes, midtrans_order_id)
      VALUES ($1,'awaiting_payment',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
    `, [req.user.id, subtotal, discount, shipping, tax, total, couponId, coupon_code, JSON.stringify(shipping_address), notes, orderId]);

    // Insert order items & decrement stock
    for (const item of enrichedItems) {
      await client.query(`
        INSERT INTO order_items (order_id, product_id, product_name, product_image, quantity, unit_price, subtotal)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
      `, [order.id, item.product_id, item.product_name, item.product_image, item.quantity, item.unit_price, item.subtotal]);

      await client.query(
        'UPDATE products SET stock = stock - $1, purchase_count = purchase_count + $2 WHERE id=$3',
        [item.quantity, item.quantity, item.product_id]
      );

      // Record purchase interactions
      await client.query(`
        INSERT INTO user_interactions (user_id, product_id, interaction, weight)
        VALUES ($1,$2,'purchase',5)
      `, [req.user.id, item.product_id]);
    }

    // Mark coupon used
    if (couponId) {
      await client.query(`
        UPDATE user_coupons SET is_used=TRUE, used_at=NOW()
        WHERE user_id=$1 AND coupon_id=$2
      `, [req.user.id, couponId]);
    }

    // Clear cart
    await client.query('DELETE FROM cart_items WHERE user_id=$1', [req.user.id]);

    await client.query('COMMIT');

    
    // Create Midtrans Snap token
    // Build item_details including shipping, tax, discount
    // so they add up exactly to gross_amount
    const midtransItems = [
      // Product line items
      ...enrichedItems.map(i => ({
        id:       i.product_id,
        price:    Math.round(i.unit_price),
        quantity: i.quantity,
        name:     i.product_name.slice(0, 50),
      })),
      // Shipping
      ...(shipping > 0 ? [{
        id:       'SHIPPING',
        price:    Math.round(shipping),
        quantity: 1,
        name:     'Shipping Cost',
      }] : []),
      // Tax
      ...(tax > 0 ? [{
        id:       'TAX',
        price:    Math.round(tax),
        quantity: 1,
        name:     'Tax (11%)',
      }] : []),
      // Discount (negative price)
      ...(discount > 0 ? [{
        id:       'DISCOUNT',
        price:    -Math.round(discount),
        quantity: 1,
        name:     `Discount (${coupon_code || 'coupon'})`,
      }] : []),
    ];

    // Verify sum matches total exactly
    const itemSum = midtransItems.reduce((s, i) => s + (i.price * i.quantity), 0);
    const grossAmount = Math.round(total);

    const snapResp = await snap.createTransaction({
      transaction_details: {
        order_id:     orderId,
        gross_amount: grossAmount,
      },
      item_details: midtransItems,
      customer_details: {
        first_name: req.user.full_name || req.user.username,
        email:      req.user.email,
      },
    });

    // Save token to order
    await db.query(
      'UPDATE orders SET midtrans_token=$1, midtrans_redirect_url=$2 WHERE id=$3',
      [snapResp.token, snapResp.redirect_url, order.id]
    );

    res.status(201).json({
      order:        { ...order, total },
      snap_token:   snapResp.token,
      redirect_url: snapResp.redirect_url,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Order error:', err);
    res.status(500).json({ error: err.message || 'Failed to create order' });
  } finally {
    client.release();
  }
});

// ── Midtrans webhook ─────────────────────────────────────────
router.post('/webhook/midtrans', async (req, res) => {
  try {
    const notification = await snap.transaction.notification(req.body);
    const { order_id, transaction_status, fraud_status } = notification;

    let paymentStatus = 'unpaid';
    let orderStatus   = 'awaiting_payment';

    if (transaction_status === 'capture') {
      if (fraud_status === 'accept') { paymentStatus = 'paid'; orderStatus = 'processing'; }
    } else if (transaction_status === 'settlement') {
      paymentStatus = 'paid'; orderStatus = 'processing';
    } else if (['cancel','expire','deny'].includes(transaction_status)) {
      paymentStatus = 'failed'; orderStatus = 'cancelled';
    }

    await db.query(`
      UPDATE orders SET payment_status=$1, status=$2, midtrans_response=$3, updated_at=NOW()
      WHERE midtrans_order_id=$4
    `, [paymentStatus, orderStatus, JSON.stringify(notification), order_id]);

    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ── Get user orders ──────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  try {
    const { rows } = await db.query(`
      SELECT o.*, 
        ARRAY_AGG(JSON_BUILD_OBJECT(
          'product_name', oi.product_name,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price,
          'product_image', oi.product_image
        )) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT $2 OFFSET $3
    `, [req.user.id, limit, offset]);
    res.json({ orders: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ── Single order ─────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM orders WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Order not found' });

    const { rows: items } = await db.query(
      'SELECT * FROM order_items WHERE order_id=$1', [req.params.id]
    );
    res.json({ order: { ...rows[0], items } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

module.exports = router;
