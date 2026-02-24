-- ============================================================
-- Partners CRM - Database Schema for laeuft.ch
-- Run this in Supabase SQL Editor
-- ============================================================

-- Partners table
CREATE TABLE partners (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  partner_type    TEXT NOT NULL DEFAULT 'Brand'
                  CHECK (partner_type IN ('Brand', 'Athlete', 'Team', 'Verband')),
  category        TEXT DEFAULT 'Sports',
  collaboration_types TEXT[] DEFAULT '{}',

  -- Kontaktperson
  contact_first_name  TEXT DEFAULT '',
  contact_last_name   TEXT DEFAULT '',
  contact_position    TEXT DEFAULT '',
  contact_email       TEXT DEFAULT '',
  contact_website     TEXT DEFAULT '',

  -- Status / Aktueller Stand
  status          TEXT NOT NULL DEFAULT 'Lead'
                  CHECK (status IN ('Lead', 'Negotiating', 'Active', 'Closed', 'Declined')),
  notes           TEXT DEFAULT '',
  status_date     DATE,

  -- Additional fields
  instagram       TEXT DEFAULT '',
  source          TEXT DEFAULT '',
  value           TEXT DEFAULT '',
  follow_up_date  DATE,
  last_contact    DATE,
  tags            TEXT[] DEFAULT '{}',

  -- Bewertung
  potenzial       TEXT DEFAULT NULL
                  CHECK (potenzial IS NULL OR potenzial IN ('Hoch', 'Mittel', 'Tief')),
  fit             TEXT DEFAULT NULL
                  CHECK (fit IS NULL OR fit IN ('Hoch', 'Mittel', 'Tief')),

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Partner history (activity log)
CREATE TABLE partner_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id  UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  author      TEXT NOT NULL,
  note        TEXT NOT NULL,
  channel     TEXT DEFAULT 'note'
              CHECK (channel IN ('email', 'instagram', 'phone', 'meeting', 'note', 'initial')),
  direction   TEXT DEFAULT 'internal'
              CHECK (direction IN ('outgoing', 'incoming', 'internal')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Partner attachments
CREATE TABLE partner_attachments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id  UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  file_name   TEXT NOT NULL,
  file_path   TEXT NOT NULL,
  file_size   INTEGER DEFAULT 0,
  mime_type   TEXT DEFAULT '',
  uploaded_by TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_partners_status ON partners(status);
CREATE INDEX idx_partners_type ON partners(partner_type);
CREATE INDEX idx_partner_history_partner ON partner_history(partner_id);
CREATE INDEX idx_partner_attachments_partner ON partner_attachments(partner_id);

-- Row Level Security (permissive)
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on partners" ON partners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on partner_history" ON partner_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on partner_attachments" ON partner_attachments FOR ALL USING (true) WITH CHECK (true);

-- Auto-update updated_at (check if function exists first)
CREATE OR REPLACE FUNCTION update_partners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER partners_updated_at
  BEFORE UPDATE ON partners
  FOR EACH ROW EXECUTE FUNCTION update_partners_updated_at();

-- Create storage bucket for partner attachments
-- (Run this separately in Supabase Dashboard > Storage > New Bucket)
-- Bucket name: partner-attachments
-- Public: false
