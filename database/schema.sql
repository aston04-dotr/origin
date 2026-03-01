-- Shadow Run — основная схема PostgreSQL
-- Запуск: psql -d shadow_run -f schema.sql

BEGIN;

-- Роли игроков
CREATE TYPE player_role AS ENUM ('cop', 'bandit');

-- Игроки
CREATE TABLE players (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username          VARCHAR(64) NOT NULL UNIQUE,
  email             VARCHAR(255) UNIQUE,
  role              player_role NOT NULL DEFAULT 'bandit',
  xp                INTEGER NOT NULL DEFAULT 0,
  level             INTEGER NOT NULL DEFAULT 1,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_players_role ON players(role);
CREATE INDEX idx_players_username ON players(username);

-- Сессии / устройства (для античита и геолокации)
CREATE TABLE player_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id         UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  device_id         VARCHAR(255),
  last_lat          DOUBLE PRECISION,
  last_lon          DOUBLE PRECISION,
  last_heading      DOUBLE PRECISION,
  last_speed_kmh    DOUBLE PRECISION,
  last_seen_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_player ON player_sessions(player_id);
CREATE INDEX idx_sessions_last_seen ON player_sessions(last_seen_at);

-- История действий: поимки, побеги
CREATE TABLE action_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id          UUID NOT NULL REFERENCES players(id),
  target_id         UUID REFERENCES players(id),
  action_type       VARCHAR(32) NOT NULL, -- 'catch', 'escape', 'patrol', 'hide'
  lat               DOUBLE PRECISION,
  lon               DOUBLE PRECISION,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_action_actor ON action_log(actor_id);
CREATE INDEX idx_action_created ON action_log(created_at);

-- Внутриигровые покупки (скины, Battle Pass, усилители)
CREATE TABLE purchases (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id         UUID NOT NULL REFERENCES players(id),
  product_id        VARCHAR(64) NOT NULL,   -- sku из Google Play / ЮKassa
  product_type      VARCHAR(32) NOT NULL,   -- 'skin', 'battle_pass', 'booster'
  platform          VARCHAR(16) NOT NULL,   -- 'android', 'ios'
  external_id       VARCHAR(255),           -- order_id от платёжной системы
  payload            JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_purchases_player ON purchases(player_id);
CREATE INDEX idx_purchases_product ON purchases(product_id);

-- Инвентарь: купленные скины/усители (активные)
CREATE TABLE inventory (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id         UUID NOT NULL REFERENCES players(id),
  product_id        VARCHAR(64) NOT NULL,
  product_type      VARCHAR(32) NOT NULL,
  expires_at        TIMESTAMPTZ,            -- NULL = навсегда (скин), иначе усилитель
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(player_id, product_id, product_type)
);

CREATE INDEX idx_inventory_player ON inventory(player_id);

-- Уровни: пороги XP для уровня (опционально, можно считать по формуле)
CREATE TABLE level_thresholds (
  level             INTEGER PRIMARY KEY,
  xp_required       INTEGER NOT NULL
);

INSERT INTO level_thresholds (level, xp_required) VALUES
  (1, 0), (2, 100), (3, 250), (4, 500), (5, 1000),
  (6, 2000), (7, 3500), (8, 5500), (9, 8000), (10, 12000);

COMMIT;
