-- CRM: Clientes de Confianza — Fase 3
-- 2026-05-16

-- ── Ampliar tabla customers ────────────────────────────────────────────────────
ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS trusted_client   BOOLEAN      NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS whatsapp_phone   VARCHAR(30),
    ADD COLUMN IF NOT EXISTS loyalty_points   INT          NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS internal_tags    TEXT[]       NOT NULL DEFAULT '{}';

-- ── Notas internas por cliente ────────────────────────────────────────────────
CREATE TABLE customer_notes (
    id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id  UUID         NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    author_id    UUID         REFERENCES users(id) ON DELETE SET NULL,
    content      TEXT         NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customer_notes_customer_id ON customer_notes(customer_id);

-- ── Ampliar CHECK de roles para incluir TRUSTED_CLIENT ───────────────────────
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users
    ADD CONSTRAINT users_role_check
    CHECK (role IN ('ADMIN', 'STAFF', 'CUSTOMER', 'TRUSTED_CLIENT'));
