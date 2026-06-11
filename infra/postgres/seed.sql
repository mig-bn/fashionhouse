-- ============================================================
-- Fashion House Boutique — Datos de prueba
-- Solo para entorno de desarrollo
-- ============================================================

-- Admin user (password: Admin1234!)
-- Hash generado con BCrypt rounds=12
INSERT INTO users (id, email, password_hash, role) VALUES
    ('00000000-0000-0000-0000-000000000001',
     'admin@fashionhouse.com',
     '$2a$12$placeholder_hash_replace_with_real_bcrypt_hash',
     'ADMIN');

-- Staff user (password: Staff1234!)
INSERT INTO users (id, email, password_hash, role) VALUES
    ('00000000-0000-0000-0000-000000000002',
     'staff@fashionhouse.com',
     '$2a$12$placeholder_hash_replace_with_real_bcrypt_hash',
     'STAFF');

-- Customer user (password: Customer1234!)
INSERT INTO users (id, email, password_hash, role) VALUES
    ('00000000-0000-0000-0000-000000000003',
     'cliente@ejemplo.com',
     '$2a$12$placeholder_hash_replace_with_real_bcrypt_hash',
     'CUSTOMER');

INSERT INTO customers (user_id, first_name, last_name, phone, city, country) VALUES
    ('00000000-0000-0000-0000-000000000003',
     'Ana', 'García', '+52 55 1234 5678', 'Ciudad de México', 'MX');

-- Categorías
INSERT INTO categories (id, name, slug, sort_order) VALUES
    ('10000000-0000-0000-0000-000000000001', 'Vestidos',    'vestidos',    1),
    ('10000000-0000-0000-0000-000000000002', 'Blusas',      'blusas',      2),
    ('10000000-0000-0000-0000-000000000003', 'Pantalones',  'pantalones',  3),
    ('10000000-0000-0000-0000-000000000004', 'Accesorios',  'accesorios',  4);

-- Productos de ejemplo
INSERT INTO products (id, category_id, name, slug, description, base_price, is_featured) VALUES
    ('20000000-0000-0000-0000-000000000001',
     '10000000-0000-0000-0000-000000000001',
     'Vestido Floral Verano',
     'vestido-floral-verano',
     'Vestido ligero con estampado floral, perfecto para el verano.',
     899.00,
     true),
    ('20000000-0000-0000-0000-000000000002',
     '10000000-0000-0000-0000-000000000002',
     'Blusa Seda Italiana',
     'blusa-seda-italiana',
     'Blusa de seda premium con acabado brillante.',
     1299.00,
     false);

-- Variantes
INSERT INTO product_variants (product_id, sku, size, color, stock_quantity) VALUES
    ('20000000-0000-0000-0000-000000000001', 'VFV-S-FLORAL',  'S',  'Floral',  10),
    ('20000000-0000-0000-0000-000000000001', 'VFV-M-FLORAL',  'M',  'Floral',  15),
    ('20000000-0000-0000-0000-000000000001', 'VFV-L-FLORAL',  'L',  'Floral',   8),
    ('20000000-0000-0000-0000-000000000002', 'BSI-S-BLANCO',  'S',  'Blanco',   5),
    ('20000000-0000-0000-0000-000000000002', 'BSI-M-BLANCO',  'M',  'Blanco',   7),
    ('20000000-0000-0000-0000-000000000002', 'BSI-S-NEGRO',   'S',  'Negro',    6);
