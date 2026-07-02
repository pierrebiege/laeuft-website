-- ============================================================
-- Haus-Biege — Währung pro Haus (Familie ist nicht nur in der CH unterwegs)
-- ============================================================

ALTER TABLE haus_biege_houses
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'EUR';
