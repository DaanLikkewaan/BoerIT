-- 001_initial_schema.sql
-- Initial database schema for BoerIT Farm Forecast

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Users ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT        NOT NULL UNIQUE,
    password_hash TEXT        NOT NULL,
    first_name    TEXT        NOT NULL,
    last_name     TEXT        NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- ── Farms ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS farms (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name           TEXT        NOT NULL,
    description    TEXT,
    location       TEXT,
    land_hectares  NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_farms_user_id ON farms (user_id);

-- ── Farm Parameters ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS farm_parameters (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id         UUID        NOT NULL REFERENCES farms (id) ON DELETE CASCADE,
    parameter_key   TEXT        NOT NULL,
    parameter_value TEXT        NOT NULL,
    unit            TEXT,
    category        TEXT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (farm_id, parameter_key)
);

CREATE INDEX IF NOT EXISTS idx_farm_parameters_farm_id ON farm_parameters (farm_id);

-- ── Livestock Groups ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS livestock_groups (
    id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id             UUID          NOT NULL REFERENCES farms (id) ON DELETE CASCADE,
    species             TEXT          NOT NULL,  -- cattle | sheep
    category            TEXT          NOT NULL,  -- cow | bull | tolly | heifer | ewe | ram | lamb | hogget
    current_count       INT           NOT NULL DEFAULT 0,
    target_count        INT,
    average_age_months  NUMERIC(6,2),
    average_weight_kg   NUMERIC(8,2),
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ,
    UNIQUE (farm_id, species, category)
);

CREATE INDEX IF NOT EXISTS idx_livestock_groups_farm_id ON livestock_groups (farm_id);

-- ── Forecasts ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS forecasts (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id         UUID        NOT NULL REFERENCES farms (id) ON DELETE CASCADE,
    generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    base_year       INT         NOT NULL,
    forecast_years  INT         NOT NULL DEFAULT 5,
    status          TEXT        NOT NULL DEFAULT 'pending' -- pending | completed | failed
);

CREATE INDEX IF NOT EXISTS idx_forecasts_farm_id ON forecasts (farm_id);

-- ── Forecast Years ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS forecast_years (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    forecast_id     UUID          NOT NULL REFERENCES forecasts (id) ON DELETE CASCADE,
    year            INT           NOT NULL,
    total_income    NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_expenses  NUMERIC(15,2) NOT NULL DEFAULT 0,
    net_profit      NUMERIC(15,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_forecast_years_forecast_id ON forecast_years (forecast_id);

-- ── Forecast Line Items ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS forecast_line_items (
    id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    forecast_year_id  UUID          NOT NULL REFERENCES forecast_years (id) ON DELETE CASCADE,
    category          TEXT          NOT NULL,
    description       TEXT          NOT NULL,
    quantity          NUMERIC(12,4) NOT NULL DEFAULT 0,
    unit_price        NUMERIC(12,2) NOT NULL DEFAULT 0,
    amount            NUMERIC(15,2) NOT NULL DEFAULT 0,
    type              TEXT          NOT NULL -- income | expense
);

CREATE INDEX IF NOT EXISTS idx_forecast_line_items_year_id ON forecast_line_items (forecast_year_id);
