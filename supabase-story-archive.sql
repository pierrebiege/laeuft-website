-- Story Archive: saves stories before they expire (24h)
CREATE TABLE IF NOT EXISTS instagram_story_archive (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id TEXT NOT NULL UNIQUE,
  media_type TEXT NOT NULL,
  media_url TEXT,
  thumbnail_url TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  permalink TEXT,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  exits INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_story_archive_timestamp ON instagram_story_archive(timestamp DESC);
