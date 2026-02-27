-- ============================================================
-- Admin Sessions - Server-side session validation
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE admin_sessions (
  token       TEXT PRIMARY KEY,
  role        TEXT NOT NULL CHECK (role IN ('admin', 'manager')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL
);

-- Index for cleanup queries
CREATE INDEX idx_admin_sessions_expires ON admin_sessions(expires_at);

-- RLS (permissive - accessed via service/anon key)
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on admin_sessions" ON admin_sessions FOR ALL USING (true) WITH CHECK (true);
