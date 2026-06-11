-- ============================================================
-- Fashion House Boutique — Esquema de base de datos
-- PostgreSQL 16
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USUARIOS Y AUTENTICACIÓN
-- ============================================================

CREATE TABLE users (
    id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL CHECK (role IN ('ADMIN', 'STAFF', 'CUSTOMER')),
    is_active     BOOLEAN      NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
    id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ  NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);

CREATE TABLE customers (
    id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID         REFERENCES users(id) ON DELETE SET NULL,
    first_name   VARCHAR(100) NOT NULL,
    last_name    VARCHAR(100) NOT NULL,
    phone        VARCHAR(30),
    birth_date   DATE,
    address_line VARCHAR(255),
    city         VARCHAR(100),
    state        VARCHAR(100),
    postal_code  VARCHAR(20),
    country      VARCHAR(100) NOT NULL DEFAULT 'MX',
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_user_id ON customers(user_id);

-- ============================================================
-- CATÁLOGO
-- ============================================================

CREATE TABLE categories (
    id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    parent_id   UUID         REFERENCES categories(id) ON DELETE SET NULL,
    is_active   BOOLEAN      NOT NULL DEFAULT true,
    sort_order  INTEGER      NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_slug      ON categories(slug);

CREATE TABLE products (
    id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID          NOT NULL REFERENCES categories(id),
    name        VARCHAR(255)  NOT NULL,
    slug        VARCHAR(280)  NOT NULL UNIQUE,
    description TEXT,
    base_price  NUMERIC(12,2) NOT NULL CHECK (base_price >= 0),
    currency    CHAR(3)       NOT NULL DEFAULT 'MXN',
    is_active   BOOLEAN       NOT NULL DEFAULT true,
    is_featured BOOLEAN       NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_slug        ON products(slug);
CREATE INDEX idx_products_is_active   ON products(is_active);
CREATE INDEX idx_products_is_featured ON products(is_featured) WHERE is_featured = true;

CREATE TABLE product_variants (
    id             UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id     UUID          NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku            VARCHAR(100)  NOT NULL UNIQUE,
    size           VARCHAR(20),
    color          VARCHAR(50),
    price_override NUMERIC(12,2),
    stock_quantity INTEGER       NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    is_active      BOOLEAN       NOT NULL DEFAULT true,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku        ON product_variants(sku);

CREATE TABLE product_images (
    id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID         NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID         REFERENCES product_variants(id) ON DELETE SET NULL,
    url        TEXT         NOT NULL,
    alt_text   VARCHAR(255),
    sort_order INTEGER      NOT NULL DEFAULT 0,
    is_primary BOOLEAN      NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_variant_id ON product_images(variant_id);

-- ============================================================
-- ÓRDENES
-- ============================================================

CREATE TABLE orders (
    id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id   UUID          NOT NULL REFERENCES customers(id),
    status        VARCHAR(30)   NOT NULL DEFAULT 'PENDING'
                      CHECK (status IN (
                          'PENDING', 'CONFIRMED', 'PROCESSING',
                          'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'
                      )),
    subtotal      NUMERIC(12,2) NOT NULL,
    discount      NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax           NUMERIC(12,2) NOT NULL DEFAULT 0,
    shipping_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    total         NUMERIC(12,2) NOT NULL,
    currency      CHAR(3)       NOT NULL DEFAULT 'MXN',
    ship_address  VARCHAR(255),
    ship_city     VARCHAR(100),
    ship_state    VARCHAR(100),
    ship_postal   VARCHAR(20),
    ship_country  VARCHAR(100),
    notes         TEXT,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status      ON orders(status);
CREATE INDEX idx_orders_created_at  ON orders(created_at DESC);

CREATE TABLE order_items (
    id           UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id     UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    variant_id   UUID          NOT NULL REFERENCES product_variants(id),
    product_name VARCHAR(255)  NOT NULL,
    variant_sku  VARCHAR(100)  NOT NULL,
    unit_price   NUMERIC(12,2) NOT NULL,
    quantity     INTEGER       NOT NULL CHECK (quantity > 0),
    line_total   NUMERIC(12,2) NOT NULL,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id   ON order_items(order_id);
CREATE INDEX idx_order_items_variant_id ON order_items(variant_id);

-- ============================================================
-- INVENTARIO
-- ============================================================

CREATE TABLE inventory_movements (
    id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id   UUID        NOT NULL REFERENCES product_variants(id),
    order_id     UUID        REFERENCES orders(id) ON DELETE SET NULL,
    type         VARCHAR(20) NOT NULL CHECK (type IN ('IN', 'OUT', 'ADJUSTMENT', 'RETURN')),
    quantity     INTEGER     NOT NULL,
    stock_before INTEGER     NOT NULL,
    stock_after  INTEGER     NOT NULL,
    reason       TEXT,
    created_by   UUID        REFERENCES users(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventory_movements_variant_id  ON inventory_movements(variant_id);
CREATE INDEX idx_inventory_movements_order_id    ON inventory_movements(order_id);
CREATE INDEX idx_inventory_movements_created_at  ON inventory_movements(created_at DESC);

-- ============================================================
-- PAGOS
-- ============================================================

CREATE TABLE payments (
    id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id          UUID          NOT NULL REFERENCES orders(id),
    amount            NUMERIC(12,2) NOT NULL,
    currency          CHAR(3)       NOT NULL DEFAULT 'MXN',
    method            VARCHAR(30)   NOT NULL
                          CHECK (method IN (
                              'CREDIT_CARD', 'DEBIT_CARD',
                              'BANK_TRANSFER', 'CASH', 'OTHER'
                          )),
    status            VARCHAR(30)   NOT NULL DEFAULT 'PENDING'
                          CHECK (status IN (
                              'PENDING', 'COMPLETED', 'FAILED',
                              'REFUNDED', 'PARTIALLY_REFUNDED'
                          )),
    gateway_reference VARCHAR(255),
    gateway_response  JSONB,
    paid_at           TIMESTAMPTZ,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status   ON payments(status);
CREATE INDEX idx_payments_paid_at  ON payments(paid_at DESC);
