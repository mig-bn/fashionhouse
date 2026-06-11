-- Módulo de Cotizaciones: ropa a la medida
-- Fase 2 — 2026-05-15

CREATE TYPE quotation_status AS ENUM (
    'DRAFT', 'PENDING', 'IN_REVIEW', 'QUOTED',
    'ACCEPTED', 'IN_PRODUCTION', 'READY', 'DELIVERED', 'REJECTED'
);

-- ── Cotizaciones ──────────────────────────────────────────────────────────────
CREATE TABLE quotations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id         UUID NOT NULL REFERENCES customers(id),
    description         TEXT NOT NULL,
    measurements        JSONB,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
                            CHECK (status IN ('DRAFT','PENDING','IN_REVIEW','QUOTED',
                                              'ACCEPTED','IN_PRODUCTION','READY','DELIVERED','REJECTED')),
    proposed_price      NUMERIC(12,2),
    currency            CHAR(3)       DEFAULT 'MXN',
    estimated_delivery  DATE,
    admin_notes         TEXT,
    rejection_reason    TEXT,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quotations_customer_id ON quotations(customer_id);
CREATE INDEX idx_quotations_status      ON quotations(status);
CREATE INDEX idx_quotations_created_at  ON quotations(created_at DESC);

-- ── Mensajes del hilo de la cotización ───────────────────────────────────────
CREATE TABLE quotation_messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id    UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    sender_type     VARCHAR(10) NOT NULL CHECK (sender_type IN ('CUSTOMER', 'STAFF')),
    sender_id       UUID REFERENCES users(id) ON DELETE SET NULL,
    content         TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quotation_messages_quotation_id ON quotation_messages(quotation_id);

-- ── Imágenes de referencia ───────────────────────────────────────────────────
CREATE TABLE quotation_images (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id    UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    url             TEXT NOT NULL,
    alt_text        VARCHAR(255),
    uploaded_by     VARCHAR(10) NOT NULL DEFAULT 'CUSTOMER'
                        CHECK (uploaded_by IN ('CUSTOMER', 'ADMIN')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quotation_images_quotation_id ON quotation_images(quotation_id);
