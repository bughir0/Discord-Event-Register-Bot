-- Esquema inicial: eventos, participantes, snapshots, logs e agregados mensais

CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  guild_id VARCHAR(32) NOT NULL,
  name VARCHAR(256) NOT NULL,
  description TEXT,
  organizer_id VARCHAR(32) NOT NULL,
  channel_id VARCHAR(32) NOT NULL,
  embed_message_id VARCHAR(32),
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  planned_duration_seconds INTEGER,
  actual_duration_seconds INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'ended', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_guild_status ON events (guild_id, status);
CREATE INDEX IF NOT EXISTS idx_events_started ON events (started_at);
CREATE INDEX IF NOT EXISTS idx_events_channel_active ON events (channel_id) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS event_participants (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  user_id VARCHAR(32) NOT NULL,
  clicked_button_at TIMESTAMPTZ,
  first_message_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_participants_event ON event_participants (event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user ON event_participants (user_id);

-- Snapshot ao finalizar para relatórios e histórico sem reprocessar linhas
CREATE TABLE IF NOT EXISTS event_snapshots (
  event_id BIGINT PRIMARY KEY REFERENCES events (id) ON DELETE CASCADE,
  count_button_only INTEGER NOT NULL DEFAULT 0,
  count_message_only INTEGER NOT NULL DEFAULT 0,
  count_both INTEGER NOT NULL DEFAULT 0,
  total_messages BIGINT NOT NULL DEFAULT 0,
  unique_participants INTEGER NOT NULL DEFAULT 0,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agregados por mês/ano (atualizados ao finalizar evento)
CREATE TABLE IF NOT EXISTS monthly_aggregates (
  id BIGSERIAL PRIMARY KEY,
  guild_id VARCHAR(32) NOT NULL,
  year SMALLINT NOT NULL,
  month SMALLINT NOT NULL CHECK (month >= 1 AND month <= 12),
  events_finished INTEGER NOT NULL DEFAULT 0,
  total_participations INTEGER NOT NULL DEFAULT 0,
  total_messages BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (guild_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_guild ON monthly_aggregates (guild_id, year, month);

CREATE TABLE IF NOT EXISTS admin_logs (
  id BIGSERIAL PRIMARY KEY,
  guild_id VARCHAR(32) NOT NULL,
  actor_id VARCHAR(32) NOT NULL,
  action VARCHAR(96) NOT NULL,
  target_type VARCHAR(48),
  target_id VARCHAR(64),
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_guild_time ON admin_logs (guild_id, created_at DESC);
