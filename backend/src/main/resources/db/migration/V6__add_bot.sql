-- V6: Bot WhatsApp / Telegram
-- Tabla de interacciones del bot y verificaciones de teléfono

CREATE TYPE bot_channel AS ENUM ('WHATSAPP', 'TELEGRAM');
CREATE TYPE bot_intent  AS ENUM ('ORDER_STATUS', 'QUOTATION_STATUS', 'HUMAN_HANDOFF', 'UNKNOWN');

CREATE TABLE bot_interactions (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  channel       bot_channel  NOT NULL,
  external_id   VARCHAR(100) NOT NULL,
  sender_name   VARCHAR(200),
  incoming_msg  TEXT         NOT NULL,
  bot_response  TEXT,
  intent        bot_intent   NOT NULL DEFAULT 'UNKNOWN',
  transferred   BOOLEAN      NOT NULL DEFAULT false,
  resolved      BOOLEAN      NOT NULL DEFAULT false,
  customer_id   UUID         REFERENCES customers(id),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE phone_verifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       VARCHAR(30) NOT NULL UNIQUE,
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bot_interactions_transferred ON bot_interactions(transferred) WHERE NOT resolved;
CREATE INDEX idx_bot_interactions_channel     ON bot_interactions(channel, created_at DESC);
