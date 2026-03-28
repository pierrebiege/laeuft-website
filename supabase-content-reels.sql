-- Content Reels table for the Content Planner dashboard
CREATE TABLE IF NOT EXISTS content_reels (
  id SERIAL PRIMARY KEY,
  reel_number INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Education',
  duration TEXT DEFAULT '15-30s',
  reel_type TEXT DEFAULT 'Music+Text',
  hook_text TEXT,
  storyboard JSONB DEFAULT '[]'::jsonb,
  audio_type TEXT DEFAULT 'Trending',
  audio_mood TEXT DEFAULT 'Upbeat',
  caption TEXT,
  sponsor TEXT,
  sponsor_details TEXT,
  voiceover_script TEXT,
  needs_voiceover BOOLEAN DEFAULT false,
  needs_video_footage BOOLEAN DEFAULT true,
  props JSONB DEFAULT '[]'::jsonb,
  month TEXT,
  season TEXT,
  status TEXT NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'planned', 'in_progress', 'filmed', 'edited', 'published')),
  priority INTEGER DEFAULT 0,
  planned_date DATE,
  published_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_reels_status ON content_reels(status);
CREATE INDEX idx_content_reels_category ON content_reels(category);
CREATE INDEX idx_content_reels_priority ON content_reels(priority DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_content_reels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_content_reels_updated_at
  BEFORE UPDATE ON content_reels
  FOR EACH ROW
  EXECUTE FUNCTION update_content_reels_updated_at();
