-- ============================================================
-- Haus-Biege — Familie Biege Hauswahl/Voting-Tool
-- Run this in Supabase SQL Editor (or via Management API)
-- Kein anon-Zugriff: nur service_role (Server-Routen /api/haus-biege/*)
-- ============================================================

CREATE TABLE haus_biege_houses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url          TEXT NOT NULL,
  title        TEXT NOT NULL DEFAULT '',
  image_url    TEXT,
  description  TEXT,
  price        NUMERIC,
  rooms        NUMERIC,
  size_m2      NUMERIC,
  location     TEXT,
  notes        TEXT,
  added_by     TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE haus_biege_votes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id     UUID NOT NULL REFERENCES haus_biege_houses(id) ON DELETE CASCADE,
  person_key   TEXT NOT NULL,
  rating       SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (house_id, person_key)
);

CREATE INDEX haus_biege_votes_house_id_idx ON haus_biege_votes(house_id);

-- Lockdown wie im Rest der App (supabase-security-lockdown.sql): RLS an+erzwungen,
-- kein anon/authenticated-Zugriff — nur service_role (BYPASSRLS) über /api/haus-biege/*.
ALTER TABLE haus_biege_houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE haus_biege_houses FORCE ROW LEVEL SECURITY;
REVOKE ALL ON haus_biege_houses FROM anon, authenticated;

ALTER TABLE haus_biege_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE haus_biege_votes FORCE ROW LEVEL SECURITY;
REVOKE ALL ON haus_biege_votes FROM anon, authenticated;
