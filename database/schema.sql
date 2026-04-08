-- ============================================================
-- ShopAI - PostgreSQL Schema
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS & AUTH
-- ============================================================
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  username      VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     VARCHAR(255),
  avatar_url    TEXT,
  phone         VARCHAR(30),
  address       TEXT,
  role          VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  total_spent   NUMERIC(14,2) DEFAULT 0,
  total_orders  INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE categories (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) UNIQUE NOT NULL,
  slug        VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon        VARCHAR(100),
  banner_url  TEXT,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE products (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id   INT REFERENCES categories(id) ON DELETE SET NULL,
  name          VARCHAR(255) NOT NULL,
  slug          VARCHAR(300) UNIQUE NOT NULL,
  description   TEXT,
  price         NUMERIC(14,2) NOT NULL,
  original_price NUMERIC(14,2),
  stock         INT DEFAULT 0,
  image_url     TEXT,
  images        JSONB DEFAULT '[]',
  tags          TEXT[],
  sku           VARCHAR(100) UNIQUE,
  weight_gram   INT,
  is_active     BOOLEAN DEFAULT TRUE,
  is_featured   BOOLEAN DEFAULT FALSE,
  avg_rating    NUMERIC(3,2) DEFAULT 0,
  review_count  INT DEFAULT 0,
  view_count    INT DEFAULT 0,
  purchase_count INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_tags ON products USING GIN(tags);

-- ============================================================
-- PRODUCT INTERACTIONS (for recommendation engine)
-- ============================================================
CREATE TABLE user_interactions (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id    UUID REFERENCES products(id) ON DELETE CASCADE,
  session_id    VARCHAR(100),
  interaction   VARCHAR(20) CHECK (interaction IN ('view', 'click', 'cart', 'purchase', 'wishlist')),
  weight        NUMERIC(4,2) DEFAULT 1.0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interactions_user ON user_interactions(user_id);
CREATE INDEX idx_interactions_product ON user_interactions(product_id);
CREATE INDEX idx_interactions_type ON user_interactions(interaction);

-- ============================================================
-- REVIEWS & RATINGS
-- ============================================================
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  order_id    UUID,
  rating      INT CHECK (rating BETWEEN 1 AND 5),
  title       VARCHAR(255),
  body        TEXT,
  images      JSONB DEFAULT '[]',
  is_verified BOOLEAN DEFAULT FALSE,
  helpful_count INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, user_id, order_id)
);

CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);

-- ============================================================
-- ORDERS & CART
-- ============================================================
CREATE TABLE orders (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
  status           VARCHAR(30) DEFAULT 'pending'
                   CHECK (status IN ('pending','awaiting_payment','paid','processing','shipped','delivered','cancelled','refunded')),
  subtotal         NUMERIC(14,2) NOT NULL,
  discount_amount  NUMERIC(14,2) DEFAULT 0,
  shipping_cost    NUMERIC(14,2) DEFAULT 0,
  tax_amount       NUMERIC(14,2) DEFAULT 0,
  total            NUMERIC(14,2) NOT NULL,
  coupon_id        UUID,
  coupon_code      VARCHAR(50),
  shipping_address JSONB,
  payment_method   VARCHAR(50),
  payment_status   VARCHAR(30) DEFAULT 'unpaid',
  midtrans_order_id VARCHAR(100) UNIQUE,
  midtrans_token   TEXT,
  midtrans_redirect_url TEXT,
  midtrans_response JSONB,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_midtrans ON orders(midtrans_order_id);

CREATE TABLE order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255),
  product_image TEXT,
  quantity    INT NOT NULL,
  unit_price  NUMERIC(14,2) NOT NULL,
  subtotal    NUMERIC(14,2) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ============================================================
-- CART (persistent)
-- ============================================================
CREATE TABLE cart_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity    INT NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ============================================================
-- COUPONS
-- ============================================================
CREATE TABLE coupons (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            VARCHAR(50) UNIQUE NOT NULL,
  description     TEXT,
  type            VARCHAR(20) CHECK (type IN ('percentage','fixed')),
  value           NUMERIC(10,2) NOT NULL,
  min_purchase    NUMERIC(14,2) DEFAULT 0,
  max_uses        INT,
  used_count      INT DEFAULT 0,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,   -- NULL = global
  is_active       BOOLEAN DEFAULT TRUE,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_coupons (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  coupon_id   UUID REFERENCES coupons(id) ON DELETE CASCADE,
  is_used     BOOLEAN DEFAULT FALSE,
  used_at     TIMESTAMPTZ,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  reason      VARCHAR(100),
  UNIQUE(user_id, coupon_id)
);

-- ============================================================
-- AI CHAT SESSIONS
-- ============================================================
CREATE TABLE ai_sessions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  session_key VARCHAR(100) NOT NULL,
  messages    JSONB DEFAULT '[]',
  context     JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- WISHLISTS
-- ============================================================
CREATE TABLE wishlists (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ============================================================
-- TRIGGERS: update timestamps
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated   BEFORE UPDATE ON users   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated  BEFORE UPDATE ON orders  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_reviews_updated BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGER: recalculate product avg_rating after review change
-- ============================================================
CREATE OR REPLACE FUNCTION recalc_product_rating()
RETURNS TRIGGER AS $$
DECLARE pid UUID;
BEGIN
  pid := COALESCE(NEW.product_id, OLD.product_id);
  UPDATE products SET
    avg_rating   = (SELECT COALESCE(AVG(rating),0) FROM reviews WHERE product_id = pid),
    review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = pid)
  WHERE id = pid;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_review_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION recalc_product_rating();

-- ============================================================
-- TRIGGER: award coupon when thresholds met
-- ============================================================
CREATE OR REPLACE FUNCTION check_coupon_eligibility()
RETURNS TRIGGER AS $$
DECLARE
  v_total_spent  NUMERIC;
  v_total_orders INT;
  v_coupon_id    UUID;
  v_already      BOOLEAN;
BEGIN
  IF NEW.payment_status = 'paid' AND OLD.payment_status <> 'paid' THEN
    -- Update user stats
    UPDATE users SET
      total_spent  = total_spent  + NEW.total,
      total_orders = total_orders + 1
    WHERE id = NEW.user_id
    RETURNING total_spent, total_orders INTO v_total_spent, v_total_orders;

    -- 10% coupon for >10 orders or >Rp 500,000 spent
    IF v_total_orders > 10 OR v_total_spent > 500000 THEN
      SELECT id INTO v_already FROM user_coupons uc
        JOIN coupons c ON c.id = uc.coupon_id
        WHERE uc.user_id = NEW.user_id AND c.value = 10 AND uc.is_used = FALSE LIMIT 1;
      IF NOT FOUND THEN
        INSERT INTO coupons (code, description, type, value, min_purchase, user_id, expires_at)
        VALUES (
          'AUTO10-' || UPPER(SUBSTRING(NEW.user_id::TEXT,1,8)),
          '10% loyalty reward',
          'percentage', 10, 50000,
          NEW.user_id,
          NOW() + INTERVAL '90 days'
        ) RETURNING id INTO v_coupon_id;
        INSERT INTO user_coupons (user_id, coupon_id, reason)
        VALUES (NEW.user_id, v_coupon_id, 'loyalty_10pct');
      END IF;
    END IF;

    -- 20% coupon for >20 orders or >Rp 1,000,000 spent
    IF v_total_orders > 20 OR v_total_spent > 1000000 THEN
      SELECT id INTO v_already FROM user_coupons uc
        JOIN coupons c ON c.id = uc.coupon_id
        WHERE uc.user_id = NEW.user_id AND c.value = 20 AND uc.is_used = FALSE LIMIT 1;
      IF NOT FOUND THEN
        INSERT INTO coupons (code, description, type, value, min_purchase, user_id, expires_at)
        VALUES (
          'AUTO20-' || UPPER(SUBSTRING(NEW.user_id::TEXT,1,8)),
          '20% VIP loyalty reward',
          'percentage', 20, 100000,
          NEW.user_id,
          NOW() + INTERVAL '90 days'
        ) RETURNING id INTO v_coupon_id;
        INSERT INTO user_coupons (user_id, coupon_id, reason)
        VALUES (NEW.user_id, v_coupon_id, 'loyalty_20pct');
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_coupon_award
AFTER UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION check_coupon_eligibility();

-- ============================================================
-- SEED: categories
-- ============================================================
INSERT INTO categories (name, slug, description, icon, sort_order) VALUES
  ('Electronics',    'electronics',    'Gadgets, phones, laptops and more',    '💻', 1),
  ('Fashion',        'fashion',        'Clothing, shoes and accessories',       '👗', 2),
  ('Home & Living',  'home-living',    'Furniture, decor and kitchen',          '🏠', 3),
  ('Sports',         'sports',         'Equipment and activewear',              '⚽', 4),
  ('Books',          'books',          'Fiction, non-fiction and textbooks',    '📚', 5),
  ('Beauty',         'beauty',         'Skincare, makeup and wellness',         '💄', 6),
  ('Toys & Games',   'toys-games',     'Kids toys and board games',             '🎮', 7),
  ('Automotive',     'automotive',     'Car accessories and spare parts',       '🚗', 8);

-- ============================================================
-- SEED: default admin user (password: Admin@123)
-- ============================================================
INSERT INTO users (email, username, password_hash, full_name, role) VALUES
  ('admin@shopai.id', 'admin', crypt('Admin@123', gen_salt('bf', 12)), 'Shop Admin', 'admin');
