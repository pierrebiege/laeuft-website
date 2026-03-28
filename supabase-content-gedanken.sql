-- Läufergedanken table: 365 philosophical quotes for Instagram
CREATE TABLE IF NOT EXISTS content_gedanken (
  id SERIAL PRIMARY KEY,
  tag_number INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Meditativ',
  philosopher TEXT NOT NULL,
  quote TEXT NOT NULL,
  context TEXT,
  status TEXT NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'planned', 'in_progress', 'designed', 'published')),
  priority INTEGER DEFAULT 0,
  planned_date DATE,
  published_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_gedanken_status ON content_gedanken(status);
CREATE INDEX idx_content_gedanken_category ON content_gedanken(category);

CREATE TRIGGER trigger_content_gedanken_updated_at
  BEFORE UPDATE ON content_gedanken
  FOR EACH ROW
  EXECUTE FUNCTION update_content_reels_updated_at();
